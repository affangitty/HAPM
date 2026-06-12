# Smoke test for gap-fill features: doctor self-profile, complete notification,
# invoice update, lab report update, HTTPS redirect (production only).
$ErrorActionPreference = "Stop"
$base = "http://localhost:5080"

function Login($email, $password) {
    (Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" `
        -Body (@{ email = $email; password = $password } | ConvertTo-Json)).accessToken
}

$admin  = Login "admin@hapm.local"    "Admin@12345"
$doctor = Login "dr.sharma@hapm.local" "Doctor@12345"
$patient = Login "patient@hapm.local"  "Patient@12345"
Write-Host "[1] Logins OK"

# Doctor self-profile update
$doc = Invoke-RestMethod "$base/api/doctors/1"
$updated = Invoke-RestMethod -Method Put -Uri "$base/api/doctors/1/profile" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $doctor" } `
    -Body (@{ fullName = $doc.fullName; phoneNumber = $doc.phoneNumber; roomNumber = "C-101"; biography = "Updated bio $(Get-Date -Format 'HHmmss')" } | ConvertTo-Json)
Write-Host "[2] Doctor self-profile -> room=$($updated.roomNumber)"

# Book + complete -> notification
$date = (Get-Date).Date.AddDays((9 - [int](Get-Date).DayOfWeek) % 7); if ($date -le (Get-Date).Date) { $date = $date.AddDays(7) }
$dateStr = $date.ToString("yyyy-MM-dd")
$slots = Invoke-RestMethod "$base/api/doctors/1/available-slots?date=$dateStr"
$appt = Invoke-RestMethod -Method Post -Uri "$base/api/appointments" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $patient" } `
    -Body (@{ doctorId = 1; appointmentDate = $dateStr; startTime = $slots[0].startTime; reason = "Follow-up check" } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/confirm" -Headers @{ Authorization = "Bearer $doctor" } | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/check-in" -Headers @{ Authorization = "Bearer $admin" } | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/complete" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $doctor" } -Body (@{ notes = "Done" } | ConvertTo-Json) | Out-Null
$completed = (Invoke-RestMethod "$base/api/notifications" -Headers @{ Authorization = "Bearer $patient" }).items | Where-Object { $_.type -eq "AppointmentCompleted" } | Select-Object -First 1
Write-Host "[3] Complete notification -> $($completed.title)"

# Invoice update (pending)
$inv = Invoke-RestMethod -Method Post -Uri "$base/api/invoices" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $admin" } `
    -Body (@{ patientId = 1; appointmentId = $appt.id; taxPercent = 18; discountAmount = 0; items = @(@{ description = "ECG"; quantity = 1; unitPrice = 400 }) } | ConvertTo-Json)
$inv = Invoke-RestMethod -Method Put -Uri "$base/api/invoices/$($inv.id)" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $admin" } `
    -Body (@{ taxPercent = 18; discountAmount = 50; notes = "Adjusted"; items = @(@{ description = "ECG"; quantity = 1; unitPrice = 500 }) } | ConvertTo-Json)
Write-Host "[4] Invoice updated -> total=$($inv.totalAmount), items=$($inv.items.Count)"

# Lab report update (metadata only - skip file for simplicity in smoke test)
# Upload first
$boundary = [System.Guid]::NewGuid().ToString()
$bodyLines = @(
    "--$boundary",
    'Content-Disposition: form-data; name="patientId"',
    '',
    '1',
    "--$boundary",
    'Content-Disposition: form-data; name="reportType"',
    '',
    'Blood Test',
    "--$boundary",
    'Content-Disposition: form-data; name="title"',
    '',
    'CBC Panel',
    "--$boundary",
    'Content-Disposition: form-data; name="file"; filename="test.pdf"',
    'Content-Type: application/pdf',
    '',
    '%PDF-1.4 dummy',
    "--$boundary--"
) -join "`r`n"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($bodyLines)
$upload = Invoke-RestMethod -Method Post -Uri "$base/api/lab-reports" `
    -Headers @{ Authorization = "Bearer $admin" } `
    -ContentType "multipart/form-data; boundary=$boundary" -Body $bytes
$boundary2 = [System.Guid]::NewGuid().ToString()
$updateBody = @(
    "--$boundary2",
    'Content-Disposition: form-data; name="reportType"',
    '',
    'Blood Test',
    "--$boundary2",
    'Content-Disposition: form-data; name="title"',
    '',
    'CBC Panel (revised)',
    "--$boundary2",
    'Content-Disposition: form-data; name="doctorId"',
    '',
    '1',
    "--$boundary2--"
) -join "`r`n"
$lr = Invoke-RestMethod -Method Put -Uri "$base/api/lab-reports/$($upload.id)" `
    -Headers @{ Authorization = "Bearer $admin" } `
    -ContentType "multipart/form-data; boundary=$boundary2" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($updateBody))
Write-Host "[5] Lab report updated -> $($lr.title)"

Write-Host "`nAll v4 smoke tests passed."
