# Prerequisites: API at http://localhost:5080, PostgreSQL up, base seed applied.
$ErrorActionPreference = "Stop"
$base = "http://localhost:5080"
$pgPassword = "affuraja"

function Login($email, $password) {
    Start-Sleep -Milliseconds 700
    (Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" `
        -Body (@{ email = $email; password = $password } | ConvertTo-Json)).accessToken
}

function Auth($token) { @{ Authorization = "Bearer $token" } }

function Skip($msg) { Write-Host "[--] $msg" -ForegroundColor Yellow }

function Ok($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }

function Try-Call([scriptblock]$action, [string]$label) {
    try { & $action; return $true }
    catch { Skip "$label - $($_.Exception.Message)"; return $false }
}

function Get-NextWeekday([DateTime]$from, [int]$daysAhead = 0) {
    $d = $from.Date.AddDays($daysAhead)
    while ($d.DayOfWeek -eq "Sunday") { $d = $d.AddDays(1) }
    return $d
}

function Get-FreeSlot($doctorId, $dateStr, $headers) {
    $slots = Invoke-RestMethod "$base/api/doctors/$doctorId/available-slots?date=$dateStr" -Headers $headers
    if ($slots.Count -eq 0) { return $null }
    return $slots[0].startTime
}

function Send-Multipart($uri, $token, [hashtable]$fields, [string]$fileName = "demo.pdf", [string]$fileContent = "%PDF-1.4 demo") {
    $boundary = [Guid]::NewGuid().ToString()
    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($kv in $fields.GetEnumerator()) {
        $lines.Add("--$boundary")
        $lines.Add("Content-Disposition: form-data; name=`"$($kv.Key)`"")
        $lines.Add("")
        $lines.Add("$($kv.Value)")
    }
    if ($fileName) {
        $lines.Add("--$boundary")
        $lines.Add("Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"")
        $lines.Add("Content-Type: application/pdf")
        $lines.Add("")
        $lines.Add($fileContent)
    }
    $lines.Add("--$boundary--")
    $body = ($lines -join "`r`n")
    Invoke-RestMethod -Method Post -Uri $uri `
        -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "multipart/form-data; boundary=$boundary" } `
        -Body ([Text.Encoding]::UTF8.GetBytes($body))
}

function Send-MultipartPut($uri, $token, [hashtable]$fields) {
    $boundary = [Guid]::NewGuid().ToString()
    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($kv in $fields.GetEnumerator()) {
        $lines.Add("--$boundary")
        $lines.Add("Content-Disposition: form-data; name=`"$($kv.Key)`"")
        $lines.Add("")
        $lines.Add("$($kv.Value)")
    }
    $lines.Add("--$boundary--")
    $body = ($lines -join "`r`n")
    Invoke-RestMethod -Method Put -Uri $uri `
        -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "multipart/form-data; boundary=$boundary" } `
        -Body ([Text.Encoding]::UTF8.GetBytes($body))
}

function Invoke-Psql([string]$sql) {
    $env:PGPASSWORD = $pgPassword
    $null = & psql -h localhost -U postgres -d hapm_db -c $sql 2>&1
    return $LASTEXITCODE -eq 0
}

function Test-PsqlAvailable {
    $env:PGPASSWORD = $pgPassword
    $null = & psql -h localhost -U postgres -d hapm_db -t -A -c "SELECT 1;" 2>&1
    return $LASTEXITCODE -eq 0
}

Write-Host "=== HAPM Full Evaluator Demo Data Loader ===" -ForegroundColor Cyan

$health = Invoke-RestMethod "$base/health"
Ok "Health: $($health.status)"

$admin     = Login "admin@hapm.local"     "Admin@12345"
$reception = Login "reception@hapm.local" "Reception@12345"
$doctor    = Login "dr.sharma@hapm.local"  "Doctor@12345"
$doctor2   = Login "dr.iyer@hapm.local"    "Doctor@12345"
$patient   = Login "patient@hapm.local"    "Patient@12345"
Ok "All role tokens obtained"

$adminH = Auth $admin
$receptionH = Auth $reception
$doctorH = Auth $doctor
$doctor2H = Auth $doctor2
$patientH = Auth $patient

# --- Doctors (add 4 more for demo) ---
$extraDoctors = @(
    @{
        email = "dr.khan@hapm.local"; password = "Doctor@12345"; fullName = "Ayesha Khan"; phoneNumber = "+910000000005"
        specialization = "Neurology"; qualification = "MBBS, DM (Neurology)"; licenseNumber = "MCI-NEUR-3003"
        experienceYears = 11; consultationFee = 1500; roomNumber = "N-110"; biography = "Neurologist focused on headaches and stroke prevention."
    },
    @{
        email = "dr.patel@hapm.local"; password = "Doctor@12345"; fullName = "Rohan Patel"; phoneNumber = "+910000000006"
        specialization = "Orthopedics"; qualification = "MBBS, MS (Ortho)"; licenseNumber = "MCI-ORTH-4004"
        experienceYears = 13; consultationFee = 1000; roomNumber = "O-210"; biography = "Orthopedic surgeon specialising in sports injuries."
    },
    @{
        email = "dr.singh@hapm.local"; password = "Doctor@12345"; fullName = "Neha Singh"; phoneNumber = "+910000000007"
        specialization = "Pediatrics"; qualification = "MBBS, MD (Pediatrics)"; licenseNumber = "MCI-PEDI-5005"
        experienceYears = 8; consultationFee = 700; roomNumber = "P-015"; biography = "Pediatrician with a focus on preventive care."
    },
    @{
        email = "dr.nair@hapm.local"; password = "Doctor@12345"; fullName = "Arjun Nair"; phoneNumber = "+910000000008"
        specialization = "ENT"; qualification = "MBBS, MS (ENT)"; licenseNumber = "MCI-ENT-6006"
        experienceYears = 10; consultationFee = 650; roomNumber = "E-005"; biography = "ENT specialist for sinus and allergy care."
    }
)

foreach ($d in $extraDoctors) {
    $existingDoc = $null
    Try-Call { $existingDoc = Invoke-RestMethod "$base/api/doctors?search=$($d.email)`&pageSize=1" } "Lookup doctor $($d.email)" | Out-Null
    if ($existingDoc -and $existingDoc.items -and $existingDoc.items.Count -gt 0) {
        Skip "Doctor already exists: $($d.email)"
        continue
    }

    if (Try-Call {
        Invoke-RestMethod -Method Post -Uri "$base/api/doctors" -ContentType "application/json" `
            -Headers $adminH -Body ($d | ConvertTo-Json) | Out-Null
        Ok "Doctor created: $($d.fullName) ($($d.specialization))"
    } "Create doctor $($d.email)") { }
}

# --- Patients (pagination) ---
$patientIds = @(1)
for ($i = 1; $i -le 15; $i++) {
    $num = "{0:D2}" -f $i
    $email = "demo.patient$num@hapm.local"
    $existing = Invoke-RestMethod "$base/api/patients?search=$email`&pageSize=1" -Headers $adminH
    if ($existing.items.Count -gt 0) {
        $patientIds += $existing.items[0].id
        continue
    }
    if (-not (Try-Call {
        $p = Invoke-RestMethod -Method Post -Uri "$base/api/patients" -ContentType "application/json" `
            -Headers $adminH -Body (@{
                email = $email; password = "Patient@12345"; fullName = "Demo Patient $num"
                phoneNumber = "+9198765432$num"; dateOfBirth = "1990-06-15"; gender = "Male"
                bloodGroup = "A+"; address = "$num Demo Street, Pune"
            } | ConvertTo-Json)
        $script:patientIds += $p.id
    } "Create $email")) { }
}
Ok "Patients: $($patientIds.Count) total"

# Login demo patient 02 for waitlist flow
$patient2Tok = $null
Try-Call { $patient2Tok = Login "demo.patient02@hapm.local" "Patient@12345" } "Login demo.patient02"

# --- Doctor self-profile ---
Try-Call {
    $doc = Invoke-RestMethod "$base/api/doctors/1"
    Invoke-RestMethod -Method Put -Uri "$base/api/doctors/1/profile" -ContentType "application/json" `
        -Headers $doctorH -Body (@{
            fullName = $doc.fullName; phoneNumber = $doc.phoneNumber
            roomNumber = "C-101"; biography = "Evaluator demo profile - senior cardiologist."
        } | ConvertTo-Json) | Out-Null
    Ok "Doctor self-profile updated"
} "Doctor profile"

# --- Prescription template ---
$templateId = $null
$tplExisting = Invoke-RestMethod "$base/api/prescription-templates" -Headers $doctorH
$tpl = $tplExisting | Where-Object { $_.name -eq "Evaluator Demo Template" } | Select-Object -First 1
if ($tpl) {
    $templateId = $tpl.id
    Skip "Prescription template already exists (#$templateId)"
} else {
    Try-Call {
        $created = Invoke-RestMethod -Method Post -Uri "$base/api/prescription-templates" -ContentType "application/json" `
            -Headers $doctorH -Body (@{
                name = "Evaluator Demo Template"; diagnosis = "Viral fever"
                notes = "Rest and fluids"; items = @(
                    @{ medicineName = "Paracetamol"; dosage = "500mg"; frequency = "Twice daily"; durationDays = 5 },
                    @{ medicineName = "Cetirizine"; dosage = "10mg"; frequency = "Once daily"; durationDays = 3 }
                )
            } | ConvertTo-Json -Depth 4)
        $templateId = $created.id
        Ok "Prescription template #$templateId created"
    } "Template create"
}

# --- Doctor leave (future date, no appointments) ---
$leaveDate = Get-NextWeekday (Get-Date).AddDays(28)
$leaveStr = $leaveDate.ToString("yyyy-MM-dd")
$leaves = Invoke-RestMethod "$base/api/doctors/1/leaves" -Headers $adminH
if ($leaves | Where-Object { $_.startDate -eq $leaveStr }) {
    Skip "Doctor leave on $leaveStr already exists"
} else {
    Try-Call {
        Invoke-RestMethod -Method Post -Uri "$base/api/doctors/1/leaves" -ContentType "application/json" `
            -Headers $doctorH -Body (@{ startDate = $leaveStr; endDate = $leaveStr; reason = "Medical conference (demo)" } | ConvertTo-Json) | Out-Null
        Ok "Doctor leave on $leaveStr"
    } "Doctor leave"
}

# --- Booking dates ---
$bookDate = Get-NextWeekday (Get-Date) 7
$dateStr = $bookDate.ToString("yyyy-MM-dd")
$dateStr2 = (Get-NextWeekday $bookDate 1).ToString("yyyy-MM-dd")
$dateStr3 = (Get-NextWeekday $bookDate 2).ToString("yyyy-MM-dd")

$slots = @(Invoke-RestMethod "$base/api/doctors/1/available-slots?date=$dateStr" -Headers $adminH)

$completedApptIds = @()
$pendingApptId = $null
$rescheduledApptId = $null
$linkedApptId = $null

function Book-Appt($doctorId, $patientId, $date, $startTime, $reason, $headers) {
    return Invoke-RestMethod -Method Post -Uri "$base/api/appointments" -ContentType "application/json" `
        -Headers $headers -Body (@{
            doctorId = $doctorId; patientId = $patientId
            appointmentDate = $date; startTime = $startTime; reason = $reason
        } | ConvertTo-Json)
}

# Spread appointments for peak-hours / analytics (multiple days, both doctors)
foreach ($pair in @(
    @{ d = $dateStr; doc = 1; pid = 1 },
    @{ d = $dateStr2; doc = 1; pid = 2 },
    @{ d = $dateStr3; doc = 1; pid = 3 },
    @{ d = $dateStr; doc = 2; pid = 4 },
    @{ d = $dateStr2; doc = 2; pid = 5 }
)) {
    $slot = Get-FreeSlot $pair.doc $pair.d $adminH
    if (-not $slot) { continue }
    Try-Call {
        $a = Book-Appt $pair.doc $pair.pid $pair.d $slot "Analytics spread demo" $adminH
        Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($a.id)/confirm" -Headers $(if ($pair.doc -eq 1) { $doctorH } else { $doctor2H }) | Out-Null
    } "Analytics appt doc$($pair.doc) $($pair.d)"
}

# Lifecycle samples on primary date (fallback to +7 days if slots full from prior run)
$lifecycleDate = $dateStr
$lifecycleSlots = @($slots)
if ($lifecycleSlots.Count -lt 6) {
    $lifecycleDate = (Get-NextWeekday $bookDate 7).ToString("yyyy-MM-dd")
    $lifecycleSlots = @(Invoke-RestMethod "$base/api/doctors/1/available-slots?date=$lifecycleDate" -Headers $adminH)
}
if ($lifecycleSlots.Count -ge 6) {
    for ($i = 0; $i -lt 6; $i++) {
        $pid = $patientIds[$i % $patientIds.Count]
        $slot = $lifecycleSlots[$i].startTime
        try {
            $appt = Book-Appt 1 $pid $lifecycleDate $slot "Lifecycle demo $($i+1)" $adminH
        } catch {
            Skip "Book lifecycle $i"
            continue
        }

        switch ($i) {
            0 { $pendingApptId = $appt.id }
            1 {
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/confirm" -Headers $doctorH | Out-Null
            }
            2 {
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/confirm" -Headers $doctorH | Out-Null
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/check-in" -Headers $receptionH | Out-Null
            }
            3 {
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/confirm" -Headers $doctorH | Out-Null
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/check-in" -Headers $receptionH | Out-Null
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/complete" -ContentType "application/json" `
                    -Headers $doctorH -Body (@{ notes = "Demo completed" } | ConvertTo-Json) | Out-Null
                $completedApptIds += $appt.id
                $linkedApptId = $appt.id
            }
            4 {
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/confirm" -Headers $doctorH | Out-Null
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/check-in" -Headers $receptionH | Out-Null
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/complete" -ContentType "application/json" `
                    -Headers $doctorH -Body (@{ notes = "Second completed" } | ConvertTo-Json) | Out-Null
                $completedApptIds += $appt.id
            }
            5 {
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/confirm" -Headers $doctorH | Out-Null
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($appt.id)/cancel" -ContentType "application/json" `
                    -Headers $adminH -Body (@{ reason = "Demo cancellation" } | ConvertTo-Json) | Out-Null
            }
        }
    }
    Ok "Appointment lifecycle samples on $lifecycleDate"
} else {
    Skip "Not enough slots for lifecycle batch on $dateStr or $lifecycleDate"
    # Use existing completed appointments for downstream steps
    $existingCompleted = Invoke-RestMethod "$base/api/appointments?status=Completed`&pageSize=5" -Headers $adminH
    foreach ($a in $existingCompleted.items) { $completedApptIds += $a.id }
    if ($existingCompleted.items.Count -gt 0) { $linkedApptId = $existingCompleted.items[0].id }
}

# Reschedule demo
if ($pendingApptId -and $slots.Count -ge 2) {
    $newSlot = $slots[1].startTime
    Try-Call {
        $res = Invoke-RestMethod -Method Put -Uri "$base/api/appointments/$pendingApptId/reschedule" -ContentType "application/json" `
            -Headers $patientH -Body (@{ appointmentDate = $dateStr; startTime = $newSlot } | ConvertTo-Json)
        $rescheduledApptId = $res.id
        Ok "Rescheduled appointment #$rescheduledApptId to $newSlot"
    } "Reschedule"
}

# Tomorrow confirmed (24h reminder window)
$tomorrow = Get-NextWeekday (Get-Date) 1
$tomorrowStr = $tomorrow.ToString("yyyy-MM-dd")
$tomSlot = Get-FreeSlot 1 $tomorrowStr $adminH
if ($tomSlot) {
    Try-Call {
        $tomAppt = Book-Appt 1 1 $tomorrowStr $tomSlot "Reminder demo (tomorrow)" $adminH
        Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($tomAppt.id)/confirm" -Headers $doctorH | Out-Null
        Ok "Tomorrow confirmed appointment #$($tomAppt.id) for reminder job"
    } "Tomorrow reminder appt"
}

# Waitlist → Notified (cancel frees slot)
if ($patient2Tok) {
    $wlSlot = Get-FreeSlot 1 $dateStr $adminH
    if ($wlSlot) {
        Try-Call {
            Invoke-RestMethod -Method Post -Uri "$base/api/waitlist" -ContentType "application/json" `
                -Headers (Auth $patient2Tok) -Body (@{ doctorId = 1; preferredDate = $dateStr; notes = "Waitlist demo" } | ConvertTo-Json) | Out-Null
            $cancelPatientId = if ($patientIds.Count -gt 5) { $patientIds[5] } else { $patientIds[1] }
            $toCancel = Book-Appt 1 $cancelPatientId $dateStr $wlSlot "To cancel for waitlist" $adminH
            Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($toCancel.id)/confirm" -Headers $doctorH | Out-Null
            Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($toCancel.id)/cancel" -ContentType "application/json" `
                -Headers $adminH -Body (@{ reason = "Free slot for waitlist demo" } | ConvertTo-Json) | Out-Null
            Ok "Waitlist notification triggered for demo.patient02"
        } "Waitlist notify flow"
    }
} else {
    Try-Call {
        Invoke-RestMethod -Method Post -Uri "$base/api/waitlist" -ContentType "application/json" `
            -Headers $patientH -Body (@{ doctorId = 1; preferredDate = $dateStr } | ConvertTo-Json) | Out-Null
        Ok "Waitlist active entry (patient 1)"
    } "Waitlist join"
}

# NoShow via SQL (past confirmed appointment → mark no-show)
if (Test-PsqlAvailable) {
    $nosql = @"
INSERT INTO ""Appointments"" (""PatientId"", ""DoctorId"", ""AppointmentDate"", ""StartTime"", ""EndTime"", ""Status"", ""Reason"", ""ReminderSent"", ""CreatedAtUtc"")
SELECT 1, 1, CURRENT_DATE - 5, '10:00'::time, '10:30'::time, 2, 'DEMO_NOSHOW_SEED', false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM ""Appointments"" WHERE ""Reason"" = 'DEMO_NOSHOW_SEED');
"@
    if (Invoke-Psql $nosql) {
        $past = Invoke-RestMethod "$base/api/appointments?search=DEMO_NOSHOW`&pageSize=1" -Headers $adminH
        if ($past.items.Count -gt 0 -and $past.items[0].status -ne "NoShow") {
            Try-Call {
                Invoke-RestMethod -Method Post -Uri "$base/api/appointments/$($past.items[0].id)/no-show" -Headers $doctorH | Out-Null
                Ok "NoShow appointment seeded and marked"
            } "Mark no-show"
        } else {
            Ok "NoShow appointment already exists"
        }
    }
} else {
    Skip "psql not available - NoShow demo skipped"
}

# Vitals (with BMI) + prescriptions (with follow-up) on completed appointments
$followUpStr = (Get-Date).Date.AddDays(1).ToString("yyyy-MM-dd")
foreach ($aid in ($completedApptIds | Select-Object -Unique)) {
    Try-Call {
        Invoke-RestMethod -Method Post -Uri "$base/api/vitals" -ContentType "application/json" `
            -Headers $receptionH -Body (@{
                appointmentId = $aid; pulseBpm = 72; systolicBpMmHg = 120; diastolicBpMmHg = 80
                temperatureCelsius = 36.6; heightCm = 175; weightKg = 70
            } | ConvertTo-Json) | Out-Null
    } "Vitals #$aid"

    $existingRx = $null
    Try-Call { $existingRx = Invoke-RestMethod "$base/api/prescriptions/by-appointment/$aid" -Headers $adminH } "Check rx"
    if (-not $existingRx) {
        $rxBody = @{
            appointmentId = $aid; diagnosis = "Evaluator demo diagnosis"; followUpDate = $followUpStr
            items = @(@{ medicineName = "Paracetamol"; dosage = "500mg"; frequency = "Twice daily"; durationDays = 5 })
        }
        if ($templateId -and $aid -eq $linkedApptId) {
            $applied = Invoke-RestMethod "$base/api/prescription-templates/$templateId" -Headers $doctorH
            $rxBody = @{
                appointmentId = $aid; diagnosis = $applied.diagnosis; notes = $applied.notes; followUpDate = $followUpStr
                items = @($applied.items | ForEach-Object {
                    @{ medicineName = $_.medicineName; dosage = $_.dosage; frequency = $_.frequency; durationDays = $_.durationDays; instructions = $_.instructions }
                })
            }
        }
        Try-Call {
            Invoke-RestMethod -Method Post -Uri "$base/api/prescriptions" -ContentType "application/json" `
                -Headers $doctorH -Body ($rxBody | ConvertTo-Json -Depth 4) | Out-Null
        } "Prescription #$aid"
    }
}
Ok "Vitals (with BMI) and prescriptions (follow-up $followUpStr)"

# Reviews on completed (patient 1 appointments only)
$reviewCount = 0
$reviewable = Invoke-RestMethod "$base/api/appointments?patientId=1&status=Completed`&pageSize=3" -Headers $adminH
foreach ($a in $reviewable.items) {
    try {
        Invoke-RestMethod -Method Post -Uri "$base/api/reviews" -ContentType "application/json" `
            -Headers $patientH -Body (@{ appointmentId = $a.id; rating = 5; comment = "Demo review" } | ConvertTo-Json) | Out-Null
        $reviewCount++
    } catch {
        Skip "Review appt #$($a.id) - already exists or not allowed"
    }
}
Ok "Reviews posted: $reviewCount"

# Lab reports: upload, update, review
$labReports = Invoke-RestMethod "$base/api/lab-reports?patientId=1`&pageSize=1" -Headers $adminH
if ($labReports.totalCount -eq 0) {
    Try-Call {
        $upload = Send-Multipart "$base/api/lab-reports" $admin @{
            patientId = "1"; doctorId = "1"; reportType = "Blood Test"; title = "CBC Panel Demo"
        }
        Send-MultipartPut "$base/api/lab-reports/$($upload.id)" $admin @{
            reportType = "Blood Test"; title = "CBC Panel Demo (revised)"; doctorId = "1"
        } | Out-Null
        Invoke-RestMethod -Method Post -Uri "$base/api/lab-reports/$($upload.id)/review" -ContentType "application/json" `
            -Headers $doctorH -Body (@{ remarks = "Results within normal range (demo)" } | ConvertTo-Json) | Out-Null
        Ok "Lab report #$($upload.id) uploaded, updated, reviewed"
    } "Lab report flow"
} else {
    Skip "Lab report already exists ($($labReports.totalCount))"
}

# Invoices: all statuses + appointment-linked + pending update
$invPending = $null
Try-Call {
    $invPending = Invoke-RestMethod -Method Post -Uri "$base/api/invoices" -ContentType "application/json" `
        -Headers $receptionH -Body (@{
            patientId = 1; taxPercent = 18; discountAmount = 0
            items = @(@{ description = "Demo lab panel"; quantity = 1; unitPrice = 500 })
        } | ConvertTo-Json)
    $invPending = Invoke-RestMethod -Method Put -Uri "$base/api/invoices/$($invPending.id)" -ContentType "application/json" `
        -Headers $receptionH -Body (@{
            taxPercent = 18; discountAmount = 25; notes = "Evaluator demo adjustment"
            items = @(@{ description = "Demo lab panel (updated)"; quantity = 1; unitPrice = 550 })
        } | ConvertTo-Json)
} "Pending invoice + update"

if ($linkedApptId) {
    $existingInv = Invoke-RestMethod "$base/api/invoices?patientId=1`&pageSize=20" -Headers $adminH
    $alreadyLinked = $existingInv.items | Where-Object { $_.appointmentId -eq $linkedApptId -and $_.status -ne "Cancelled" }
    if ($alreadyLinked) {
        Skip "Appointment-linked invoice already exists (#$($alreadyLinked[0].id))"
    } else {
        Try-Call {
            $linkedInv = Invoke-RestMethod -Method Post -Uri "$base/api/invoices" -ContentType "application/json" `
                -Headers $receptionH -Body (@{
                    patientId = 1; appointmentId = $linkedApptId; taxPercent = 18; discountAmount = 0
                    items = @(@{ description = "ECG"; quantity = 1; unitPrice = 450 })
                } | ConvertTo-Json)
            Ok "Appointment-linked invoice #$($linkedInv.id) (includes consultation fee)"
        } "Linked invoice"
    }
}

Try-Call {
    $invPartial = Invoke-RestMethod -Method Post -Uri "$base/api/invoices" -ContentType "application/json" `
        -Headers $receptionH -Body (@{
            patientId = 1; taxPercent = 0; items = @(@{ description = "Partial pay demo"; quantity = 1; unitPrice = 1000 })
        } | ConvertTo-Json)
    Invoke-RestMethod -Method Post -Uri "$base/api/invoices/$($invPartial.id)/payments" -ContentType "application/json" `
        -Headers $receptionH -Body (@{ amount = 400; paymentMethod = "Cash" } | ConvertTo-Json) | Out-Null
} "Partial invoice"

Try-Call {
    $invPaid = Invoke-RestMethod -Method Post -Uri "$base/api/invoices" -ContentType "application/json" `
        -Headers $receptionH -Body (@{
            patientId = 1; items = @(@{ description = "Paid demo"; quantity = 1; unitPrice = 300 })
        } | ConvertTo-Json)
    Invoke-RestMethod -Method Post -Uri "$base/api/invoices/$($invPaid.id)/payments" -ContentType "application/json" `
        -Headers $receptionH -Body (@{ amount = 300; paymentMethod = "Upi" } | ConvertTo-Json) | Out-Null
} "Paid invoice"

Try-Call {
    $invCancel = Invoke-RestMethod -Method Post -Uri "$base/api/invoices" -ContentType "application/json" `
        -Headers $receptionH -Body (@{
            patientId = 1; items = @(@{ description = "Cancelled demo"; quantity = 1; unitPrice = 100 })
        } | ConvertTo-Json)
    Invoke-RestMethod -Method Post -Uri "$base/api/invoices/$($invCancel.id)/cancel" -Headers $receptionH | Out-Null
} "Cancelled invoice"

Ok "Invoices: pending (updated), partial, paid, cancelled, appointment-linked"

# Dr Iyer revenue (dermatology payment)
$dermPatientId = if ($patientIds.Count -gt 4) { $patientIds[4] } else { 1 }
Try-Call {
    $invDerm = Invoke-RestMethod -Method Post -Uri "$base/api/invoices" -ContentType "application/json" `
        -Headers $receptionH -Body (@{
            patientId = $dermPatientId; taxPercent = 0; items = @(@{ description = "Dermatology consult"; quantity = 1; unitPrice = 800 })
        } | ConvertTo-Json)
    Invoke-RestMethod -Method Post -Uri "$base/api/invoices/$($invDerm.id)/payments" -ContentType "application/json" `
        -Headers $receptionH -Body (@{ amount = 800; paymentMethod = "Card" } | ConvertTo-Json) | Out-Null
    Ok "Dermatology revenue payment recorded"
} "Dr Iyer revenue"

# Analytics sanity check
$stats = Invoke-RestMethod "$base/api/dashboard/stats" -Headers $adminH
$heat = Invoke-RestMethod "$base/api/dashboard/peak-hours" -Headers $adminH
$rev = Invoke-RestMethod "$base/api/dashboard/revenue-by-specialization" -Headers $adminH
$perf = Invoke-RestMethod "$base/api/doctors/1/performance" -Headers $adminH
Ok "Dashboard: $($stats.totalPatients) patients, $($stats.totalAppointments) appts, peak cells=$($heat.Count), revenue buckets=$($rev.Count), dr rating=$($perf.averageRating)"

# Audit + exports
$audit = Invoke-RestMethod "$base/api/audit-logs?pageSize=5" -Headers $adminH
$csv = Invoke-WebRequest "$base/api/exports/appointments" -Headers $adminH -UseBasicParsing
Ok "Audit entries: $($audit.totalCount); CSV export: $($csv.StatusCode)"

# Error demos (logged)
if ($slots.Count -gt 0) {
    try {
        Invoke-RestMethod -Method Post -Uri "$base/api/appointments" -ContentType "application/json" `
            -Headers $adminH -Body (@{
                doctorId = 1; patientId = 1; appointmentDate = $dateStr
                startTime = $slots[0].startTime; reason = "Duplicate demo"
            } | ConvertTo-Json) | Out-Null
        Skip "Double-booking was allowed"
    } catch {
        Ok "409 double-booking rejected as expected"
    }
}

try {
    Invoke-RestMethod "$base/api/appointments/999999" -Headers $adminH | Out-Null
    Skip "404 should have failed"
} catch {
    Ok "404 not found works"
}

try {
    Invoke-RestMethod -Method Post -Uri "$base/api/vitals" -ContentType "application/json" `
        -Headers $receptionH -Body (@{ appointmentId = 1; systolicBpMmHg = 80; diastolicBpMmHg = 120 } | ConvertTo-Json) | Out-Null
    Skip "400 BP validation should have failed"
} catch {
    Ok "400 validation error works (BP)"
}

# Summary
Write-Host ""
Write-Host "=== Postman environment values ===" -ForegroundColor Cyan
Write-Host "  bookDate       = $dateStr"
Write-Host "  tomorrowDate   = $tomorrowStr"
Write-Host "  leaveDate      = $leaveStr"
Write-Host "  templateId     = $(if ($templateId) { $templateId } else { '(see GET /api/prescription-templates)' })"
Write-Host "  appointmentId  = $(if ($linkedApptId) { $linkedApptId } elseif ($pendingApptId) { $pendingApptId } else { '(see GET /api/appointments?status=Completed)' })"
Write-Host "  invoiceId      = $(if ($invPending) { $invPending.id } else { '(see GET /api/invoices?status=Pending)' })"
Write-Host ""
$apptList = Invoke-RestMethod "$base/api/appointments?page=1`&pageSize=1" -Headers $adminH
$patList = Invoke-RestMethod "$base/api/patients?page=1`&pageSize=1" -Headers $adminH
$invList = Invoke-RestMethod "$base/api/invoices?page=1`&pageSize=1" -Headers $adminH
Write-Host "=== Data counts ===" -ForegroundColor Cyan
Write-Host "  Appointments: $($apptList.totalCount) | Patients: $($patList.totalCount) | Invoices: $($invList.totalCount)"
Write-Host ""
Write-Host "Demo data load complete. Import postman/HAPM-Setup + HAPM-Demo-Workflows + HAPM-Evaluator.postman_environment.json" -ForegroundColor Green
Write-Host "Run HAPM Setup (Private) with 1500ms delay, then folder 00 - Initialize IDs." -ForegroundColor Green
