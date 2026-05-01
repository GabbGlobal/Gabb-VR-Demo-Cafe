using System.Threading.Tasks;

public class SessionApiService
{
    private readonly ApiClient apiClient;

    public SessionApiService(ApiClient apiClient)
    {
        this.apiClient = apiClient;
    }

    public Task<SessionEventResponse> SendEventAsync(SessionEventRequest request)
    {
        return apiClient.PostAsync<SessionEventRequest, SessionEventResponse>("/session/event", request);
    }

    public Task<SessionEndResponse> EndSessionAsync(SessionEndRequest request)
    {
        return apiClient.PostAsync<SessionEndRequest, SessionEndResponse>("/session/end", request);
    }
}
