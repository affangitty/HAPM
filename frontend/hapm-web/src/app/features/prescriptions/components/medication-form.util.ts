import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrescriptionItemRequest } from '../models/prescription.models';

export function createMedicationGroup(fb: FormBuilder, item?: Partial<PrescriptionItemRequest>): FormGroup {
  return fb.nonNullable.group({
    medicineName: [item?.medicineName ?? '', [Validators.required, Validators.maxLength(200)]],
    dosage: [item?.dosage ?? '', [Validators.required, Validators.maxLength(50)]],
    frequency: [item?.frequency ?? '', [Validators.required, Validators.maxLength(50)]],
    durationDays: [item?.durationDays ?? 7, [Validators.required, Validators.min(1), Validators.max(365)]],
    instructions: [item?.instructions ?? '', Validators.maxLength(300)],
  });
}

export function medicationItemsToRequest(items: FormGroup[]): PrescriptionItemRequest[] {
  return items.map((group) => ({
    medicineName: group.controls['medicineName'].value as string,
    dosage: group.controls['dosage'].value as string,
    frequency: group.controls['frequency'].value as string,
    durationDays: Number(group.controls['durationDays'].value),
    instructions: (group.controls['instructions'].value as string) || undefined,
  }));
}
