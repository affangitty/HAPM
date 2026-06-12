using HAPM.Application.Common;

namespace HAPM.Application.Validation;

public static class VitalSignRules
{
    public static void ValidateBloodPressure(int? systolicMmHg, int? diastolicMmHg)
    {
        if (systolicMmHg is null || diastolicMmHg is null)
            return;

        if (systolicMmHg <= diastolicMmHg)
            throw new BadRequestException("Systolic blood pressure must be greater than diastolic blood pressure.");
    }
}
