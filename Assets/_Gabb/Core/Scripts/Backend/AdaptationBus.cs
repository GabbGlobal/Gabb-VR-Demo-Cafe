using System;

public static class AdaptationBus
{
    public static event Action<SessionEventResponse> OnAdaptationReceived;
    public static event Action<string> OnStatusChanged;
    public static event Action<string> OnTeacherMessage;

    public static void Publish(SessionEventResponse response)
    {
        OnAdaptationReceived?.Invoke(response);
        OnStatusChanged?.Invoke(response.Status);

        if (response.Adaptations?.Message != null)
            OnTeacherMessage?.Invoke(response.Adaptations.Message);
    }

    public static void Reset()
    {
        OnAdaptationReceived = null;
        OnStatusChanged = null;
        OnTeacherMessage = null;
    }
}
