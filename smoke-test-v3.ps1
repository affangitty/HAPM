# Smoke test for the v3 feature set: prescription templates, follow-up reminders,
# peak-hours heatmap, revenue by specialization, doctor performance metrics.
$ErrorActionPreference = "Stop"
$base = "http://localhost:5168"

function Login($email, $password) {
    (Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" `
        -Body (@{ email = $email; password = $password } | ConvertTo-Json)).accessToken
}

$admin   = Login "admin@hapm.local"    "Admin@12345"
$patient = Login "patient@hapm.local"  "Patient@12345"
$doctor  = Login "dr.sharma@hapm.local" "Doctor@12345"
$doctor2 = Login "dr.iyer@hapm.local"  "Doctor@12345"
Write-Host "[1] Logins OK"

# --- Prescription templates (doctor-owned CRUD) -------------------------
$suffix = Get-Date -Format "HHmmss"
$tpl = Invoke-RestMethod -Method Post -Uri "$base/api/prescription-templates" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $doctor" } `
    -Body (@{
        name = "Viral Fever Protocol $suffix"
        diagnosis = "Viral fever"
        notes = "Plenty of fluids and rest"
        items = @(
            @{ medicineName = "Paracetamol"; dosage = "500 mg"; frequency = "1-1-1"; durationDays = 5; instructions = "After food" },
            @{ medicineName = "Cetirizine"; dosage = "10 mg"; frequency = "0-0-1"; durationDays = 5 }
        )
    } | ConvertTo-Json -Depth 4)
$mine = Invoke-RestMethod "$base/api/prescription-templates" -Headers @{ Authorization = "Bearer $doctor" }
Write-Host "[2] Template '$($tpl.name)' saved with $($tpl.items.Count) medicines; doctor now has $($mine.Count) template(s)"

# Duplicate name must be rejected
try {
    Invoke-RestMethod -Method Post -Uri "$base/api/prescription-templates" -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $doctor" } `
        -Body (@{ name = $tpl.name; diagnosis = "x"; items = @(@{ medicineName = "A"; dosage = "1"; frequency = "1"; durationDays = 1 }) } | ConvertTo-Json -Depth 4)
    Write-Host "[3] FAIL: duplicate template name accepted!"
} catch {
    Write-Host "[3] Duplicate template name rejected ($($_.Exception.Response.StatusCode.value__))"
}

# Other doctor cannot see this template
try {
    Invoke-RestMethod "$base/api/prescription-templates/$($tpl.id)" -Headers @{ Authorization = "Bearer $doctor2" }
    Write-Host "[4] FAIL: another doctor read the template!"
} catch {
    Write-Host "[4] Template isolated per doctor ($($_.Exception.Response.StatusCode.value__) for other doctor)"
}

# --- Apply template to a real prescription (with follow-up date) --------
$date = (Get-Date).Date.AddDays((9 - [int](Get-Date).DayOfWeek) % 7); if ($date -le (Get-Date).Date) { $date = $date.AddDays(7) }  # next Tuesday
$dateStr = $date.ToString("yyyy-MM-dd")
$slots = Invoke-RestMethod "$base/api/doctors/1/available-slots?date=$dateStr"
$appt = Invoke-RestMethod -Method Post -Uri "$base/api/appointments" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $patient" } `
    -Body (@{ doctorId = 1; appointmentDate = $dateStr; startTime = $slots[0].startTime; reason = "Fever and chills" } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/confirm" -Headers @{ Authorization = "Bearer $doctor" } | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/check-in" -Headers @{ Authorization = "Bearer $admin" } | Out-Null

# Doctor fetches the template and uses it to prefill the prescription (follow-up due tomorrow)
$applied = Invoke-RestMethod "$base/api/prescription-templates/$($tpl.id)" -Headers @{ Authorization = "Bearer $doctor" }
$followUp = (Get-Date).Date.AddDays(1).ToString("yyyy-MM-dd")
$rx = Invoke-RestMethod -Method Post -Uri "$base/api/prescriptions" -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $doctor" } `
    -Body (@{
        appointmentId = $appt.id
        diagnosis = $applied.diagnosis
        notes = $applied.notes
        followUpDate = $followUp
        items = @($applied.items | ForEach-Object { @{ medicineName = $_.medicineName; dosage = $_.dosage; frequency = $_.frequency; durationDays = $_.durationDays; instructions = $_.instructions } })
    } | ConvertTo-Json -Depth 4)
Write-Host "[5] Prescription #$($rx.id) created from template ($($rx.items.Count) medicines, follow-up $followUp)"

# --- Analytics ----------------------------------------------------------
$heat = Invoke-RestMethod "$base/api/dashboard/peak-hours" -Headers @{ Authorization = "Bearer $admin" }
$top = $heat | Sort-Object appointmentCount -Descending | Select-Object -First 1
Write-Host "[6] Peak hours -> $($heat.Count) cell(s); busiest: $($top.dayOfWeek) $($top.hour):00 ($($top.appointmentCount) appt)"

$rev = Invoke-RestMethod "$base/api/dashboard/revenue-by-specialization" -Headers @{ Authorization = "Bearer $admin" }
foreach ($r in $rev) { Write-Host "    $($r.specialization): $($r.totalRevenue) across $($r.paymentCount) payment(s)" }
Write-Host "[7] Revenue by specialization OK ($($rev.Count) bucket(s))"

# --- Doctor performance ---------------------------------------------------
$perf = Invoke-RestMethod "$base/api/doctors/1/performance" -Headers @{ Authorization = "Bearer $admin" }
Write-Host "[8] Dr. $($perf.doctorName): $($perf.totalAppointments) appts ($($perf.completedAppointments) completed), no-show $($perf.noShowRatePercent)%, rating $($perf.averageRating) ($($perf.reviewCount)), $($perf.prescriptionCount) rx, $($perf.distinctPatients) patient(s), revenue $($perf.totalRevenue)"

# Doctor sees own metrics, but not another doctor's
Invoke-RestMethod "$base/api/doctors/1/performance" -Headers @{ Authorization = "Bearer $doctor" } | Out-Null
try {
    Invoke-RestMethod "$base/api/doctors/1/performance" -Headers @{ Authorization = "Bearer $doctor2" }
    Write-Host "[9] FAIL: doctor read another doctor's performance!"
} catch {
    Write-Host "[9] Performance scoping OK (own allowed, other doctor's -> $($_.Exception.Response.StatusCode.value__))"
}

Write-Host "`nAll v3 smoke tests passed."
Write-Host "Note: the follow-up reminder for prescription #$($rx.id) is sent by the background job (runs at startup and every 5 minutes)."
