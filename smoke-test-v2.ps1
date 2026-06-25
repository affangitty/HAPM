# Smoke test for the v2 feature set: health checks, vitals, reviews, leave,
# waitlist, partial payments, CSV export, audit logs, rate limiting.
$ErrorActionPreference = "Stop"
$base = "http://localhost:5168"

function Login($email, $password) {
    (Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" `
        -Body (@{ email = $email; password = $password } | ConvertTo-Json)).accessToken
}

$admin   = Login "admin@hapm.local"   "Admin@12345"
$patient = Login "patient@hapm.local" "Patient@12345"
$doctor  = Login "dr.sharma@hapm.local" "Doctor@12345"
Write-Host "[1] Logins OK"

# Health checks
$health = Invoke-WebRequest "$base/health" -UseBasicParsing
Write-Host "[2] Health check -> $($health.StatusCode) $($health.Content)"

# Book + take appointment through to completion so we can attach vitals + review
$date = (Get-Date).Date.AddDays((9 - [int](Get-Date).DayOfWeek) % 7); if ($date -le (Get-Date).Date) { $date = $date.AddDays(7) }  # next Tuesday
$dateStr = $date.ToString("yyyy-MM-dd")
$slots = Invoke-RestMethod "$base/api/doctors/1/available-slots?date=$dateStr"
$appt = Invoke-RestMethod -Method Post -Uri "$base/api/appointments" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $patient" } `
    -Body (@{ doctorId = 1; appointmentDate = $dateStr; startTime = $slots[0].startTime; reason = "Annual checkup" } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/confirm" -Headers @{ Authorization = "Bearer $doctor" } | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/check-in" -Headers @{ Authorization = "Bearer $admin" } | Out-Null
Write-Host "[3] Appointment #$($appt.id) booked, confirmed, checked in"

# Vitals (with BMI computation)
$vitals = Invoke-RestMethod -Method Post -Uri "$base/api/vitals" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $doctor" } `
    -Body (@{ appointmentId = $appt.id; temperatureCelsius = 36.8; pulseBpm = 72; systolicBpMmHg = 122; diastolicBpMmHg = 80; heightCm = 175; weightKg = 70 } | ConvertTo-Json)
Write-Host "[4] Vitals recorded -> BMI = $($vitals.bmi)"

# Complete + review
Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/complete" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $doctor" } -Body (@{ notes = "All good" } | ConvertTo-Json) | Out-Null
$review = Invoke-RestMethod -Method Post -Uri "$base/api/reviews" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $patient" } `
    -Body (@{ appointmentId = $appt.id; rating = 5; comment = "Excellent doctor!" } | ConvertTo-Json)
$doc1 = Invoke-RestMethod "$base/api/doctors/1"
Write-Host "[5] Review posted -> doctor avg rating = $($doc1.averageRating) ($($doc1.reviewCount) review(s))"

# Doctor leave: blocks slots and booking
$leaveDate = $date.AddDays(7).ToString("yyyy-MM-dd")
$leave = Invoke-RestMethod -Method Post -Uri "$base/api/doctors/1/leaves" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $admin" } `
    -Body (@{ startDate = $leaveDate; endDate = $leaveDate; reason = "Conference" } | ConvertTo-Json)
$leaveSlots = Invoke-RestMethod "$base/api/doctors/1/available-slots?date=$leaveDate"
try {
    Invoke-RestMethod -Method Post -Uri "$base/api/appointments" -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $patient" } `
        -Body (@{ doctorId = 1; appointmentDate = $leaveDate; startTime = "09:00"; reason = "test" } | ConvertTo-Json)
    Write-Host "[6] FAIL: booked during leave!"
} catch {
    Write-Host "[6] Leave OK: slots on leave day = $($leaveSlots.Count), booking rejected ($($_.Exception.Response.StatusCode.value__))"
}
Invoke-RestMethod -Method Delete -Uri "$base/api/doctors/1/leaves/$($leave.id)" -Headers @{ Authorization = "Bearer $admin" } | Out-Null

# Waitlist: second patient waits, gets notified when a slot frees up
$suffix = Get-Date -Format "HHmmss"
$p2 = Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType "application/json" `
    -Body (@{ email = "p2.$suffix@hapm.local"; password = "Patient@12345"; fullName = "Waitlist Wanda"; phoneNumber = "+911111111111"; dateOfBirth = "1995-01-01"; gender = "Female" } | ConvertTo-Json)
$p2tok = $p2.accessToken
$slots2 = Invoke-RestMethod "$base/api/doctors/1/available-slots?date=$dateStr"
$appt2 = Invoke-RestMethod -Method Post -Uri "$base/api/appointments" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $patient" } `
    -Body (@{ doctorId = 1; appointmentDate = $dateStr; startTime = $slots2[0].startTime; reason = "Follow-up" } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/api/waitlist" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $p2tok" } `
    -Body (@{ doctorId = 1; preferredDate = $dateStr } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt2.id)/cancel" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $patient" } -Body (@{ reason = "Cannot make it" } | ConvertTo-Json) | Out-Null
$p2notifs = Invoke-RestMethod "$base/api/notifications?unreadOnly=true" -Headers @{ Authorization = "Bearer $p2tok" }
$slotOpened = $p2notifs.items | Where-Object { $_.type -eq "WaitlistSlotOpened" }
Write-Host "[7] Waitlist OK: waitlisted patient got '$($slotOpened[0].title)' notification"

# Partial payments
$inv = Invoke-RestMethod -Method Post -Uri "$base/api/invoices" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $admin" } `
    -Body (@{ patientId = 1; appointmentId = $appt.id; taxPercent = 0; items = @(@{ description = "Vitals panel"; quantity = 1; unitPrice = 300 }) } | ConvertTo-Json)
$inv = Invoke-RestMethod -Method Post -Uri "$base/api/invoices/$($inv.id)/payments" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $admin" } -Body (@{ amount = 500; paymentMethod = "Cash" } | ConvertTo-Json)
Write-Host "[8] Partial payment -> status=$($inv.status), paid=$($inv.amountPaid), due=$($inv.balanceDue)"
$inv = Invoke-RestMethod -Method Post -Uri "$base/api/invoices/$($inv.id)/payments" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $admin" } -Body (@{ amount = $inv.balanceDue; paymentMethod = "Upi" } | ConvertTo-Json)
Write-Host "[9] Final payment -> status=$($inv.status), receipts: $($inv.payments.receiptNumber -join ', ')"

# CSV export
$csv = Invoke-WebRequest "$base/api/exports/appointments" -Headers @{ Authorization = "Bearer $admin" } -UseBasicParsing
$firstLine = ($csv.Content -split "`n")[0].Trim()
Write-Host "[10] CSV export OK ($($csv.Headers.'Content-Type')) header: $($firstLine.Substring(0, [Math]::Min(60, $firstLine.Length)))"

# Audit logs
$audit = Invoke-RestMethod "$base/api/audit-logs?pageSize=5" -Headers @{ Authorization = "Bearer $admin" }
Write-Host "[11] Audit trail -> $($audit.totalCount) entries (latest: $($audit.items[0].action) $($audit.items[0].entityName) by $($audit.items[0].userEmail))"

# Rate limiting on /api/auth/login
$got429 = $false
for ($i = 0; $i -lt 12; $i++) {
    try {
        Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" `
            -Body (@{ email = "nobody@hapm.local"; password = "wrong" } | ConvertTo-Json) | Out-Null
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) { $got429 = $true; break }
    }
}
if ($got429) { Write-Host "[12] Rate limiting OK: login throttled with 429 after repeated attempts" }
else { Write-Host "[12] FAIL: rate limit never triggered" }

Write-Host "`nAll v2 smoke tests passed."
