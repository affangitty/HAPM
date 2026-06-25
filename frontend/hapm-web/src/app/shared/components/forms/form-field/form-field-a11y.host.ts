let formFieldSeq = 0;

export class FormFieldA11yHost {
  readonly controlId = `ff-${++formFieldSeq}`;
  readonly errorId = `${this.controlId}-error`;
  readonly hintId = `${this.controlId}-hint`;

  error: string | null = null;
  hint: string | null = null;

  get describedBy(): string | null {
    if (this.error) return this.errorId;
    if (this.hint) return this.hintId;
    return null;
  }

  get invalid(): boolean {
    return !!this.error;
  }
}
