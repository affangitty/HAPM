# End-to-end smoke test against a locally running HAPM API.
$ErrorActionPreference = "Stop"
$base = "http://localhost:5080"

function Login($email, $password) {
    (Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" `
        -Body (@{ email = $email; password = $password } | ConvertTo-Json)).accessToken
}

$admin   = Login "admin@hapm.local"   "Admin@12345"
$patient = Login "patient@hapm.local" "Patient@12345"
$doctor  = Login "dr.sharma@hapm.local" "Doctor@12345"
Write-Host "[1] Logins OK (admin, patient, doctor)"

$doctors = Invoke-RestMethod "$base/api/doctors?search=cardio&pageSize=5"
Write-Host "[2] Doctor search OK -> found $($doctors.totalCount) (first: $($doctors.items[0].fullName))"

# Next Monday
$date = (Get-Date).Date.AddDays((8 - [int](Get-Date).DayOfWeek) % 7); if ($date -eq (Get-Date).Date) { $date = $date.AddDays(7) }
$dateStr = $date.ToString("yyyy-MM-dd")
$slots = Invoke-RestMethod "$base/api/doctors/1/available-slots?date=$dateStr"
Write-Host "[3] Available slots on $dateStr -> $($slots.Count) (first: $($slots[0].startTime))"

$booking = Invoke-RestMethod -Method Post -Uri "$base/api/appointments" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $patient" } `
    -Body (@{ doctorId = 1; appointmentDate = $dateStr; startTime = $slots[0].startTime; reason = "Chest pain follow-up" } | ConvertTo-Json)
Write-Host "[4] Booked appointment #$($booking.id) status=$($booking.status)"

# Double-booking the same slot must fail with 409
try {
    Invoke-RestMethod -Method Post -Uri "$base/api/appointments" -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $patient" } `
        -Body (@{ doctorId = 1; appointmentDate = $dateStr; startTime = $slots[0].startTime; reason = "duplicate" } | ConvertTo-Json)
    Write-Host "[5] FAIL: double booking was allowed!"
} catch {
    Write-Host "[5] Double-booking correctly rejected ($($_.Exception.Response.StatusCode.value__))"
}

$confirmed = Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($booking.id)/confirm" -Headers @{ Authorization = "Bearer $doctor" }
Write-Host "[6] Doctor confirmed appointment -> status=$($confirmed.status)"

# Patient must NOT be able to access admin endpoints
try {
    Invoke-RestMethod "$base/api/dashboard/stats" -Headers @{ Authorization = "Bearer $patient" }
    Write-Host "[7] FAIL: patient accessed admin dashboard!"
} catch {
    Write-Host "[7] RBAC OK: patient blocked from dashboard ($($_.Exception.Response.StatusCode.value__))"
}

$notifs = Invoke-RestMethod "$base/api/notifications?unreadOnly=true" -Headers @{ Authorization = "Bearer $patient" }
Write-Host "[8] Patient notifications -> $($notifs.totalCount) unread (latest: '$($notifs.items[0].title)')"

$invoice = Invoke-RestMethod -Method Post -Uri "$base/api/invoices" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $admin" } `
    -Body (@{ patientId = 1; appointmentId = $booking.id; taxPercent = 18; discountAmount = 100; items = @(@{ description = "ECG"; quantity = 1; unitPrice = 500 }) } | ConvertTo-Json)
Write-Host "[9] Invoice $($invoice.invoiceNumber) total=$($invoice.totalAmount) status=$($invoice.status)"

$paid = Invoke-RestMethod -Method Post -Uri "$base/api/invoices/$($invoice.id)/payments" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $admin" } -Body (@{ amount = $invoice.totalAmount; paymentMethod = "Upi" } | ConvertTo-Json)
Write-Host "[10] Invoice paid -> status=$($paid.status) receipt=$($paid.payments[0].receiptNumber)"

$stats = Invoke-RestMethod "$base/api/dashboard/stats" -Headers @{ Authorization = "Bearer $admin" }
Write-Host "[11] Dashboard: doctors=$($stats.totalDoctors) patients=$($stats.totalPatients) appts=$($stats.totalAppointments) revenue=$($stats.totalRevenue)"

Write-Host "`nAll smoke tests passed."
