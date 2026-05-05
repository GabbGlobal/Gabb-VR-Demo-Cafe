using System;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;

public class ApiClient : MonoBehaviour
{
    [SerializeField] private BackendConfig config;

    public bool IsConnected { get; private set; }

    public async Task<bool> WarmUpAsync(float timeoutOverride = 0f)
    {
        string url = BuildUrl(config.apiBaseUrl, "/health");
        using var request = UnityWebRequest.Get(url);
        request.timeout = Mathf.CeilToInt(timeoutOverride > 0f ? timeoutOverride : config.requestTimeoutSeconds);

        try
        {
            await request.SendWebRequest();
            IsConnected = request.result == UnityWebRequest.Result.Success;
            Debug.Log(IsConnected
                ? "[ApiClient] Server warm-up OK"
                : $"[ApiClient] Server warm-up failed: {request.responseCode} {request.error}");
            return IsConnected;
        }
        catch (Exception e)
        {
            IsConnected = false;
            Debug.LogWarning($"[ApiClient] Server warm-up exception: {e.Message}");
            return false;
        }
    }

    public async Task<TRes> PostAsync<TReq, TRes>(string endpoint, TReq body, float timeoutOverride = 0f)
        where TRes : class
    {
        string url = BuildUrl(config.apiBaseUrl, endpoint);
        string jsonBody = JsonConvert.SerializeObject(body, new JsonSerializerSettings
        {
            NullValueHandling = NullValueHandling.Ignore
        });

        using var request = new UnityWebRequest(url, "POST");
        request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(jsonBody));
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        request.timeout = Mathf.CeilToInt(timeoutOverride > 0f ? timeoutOverride : config.requestTimeoutSeconds);

        try
        {
            await request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                IsConnected = true;
                Debug.Log($"[ApiClient] POST {endpoint} -> {request.responseCode}");
                return JsonConvert.DeserializeObject<TRes>(request.downloadHandler.text);
            }

            IsConnected = false;
            string responseBody = request.downloadHandler?.text;
            Debug.LogWarning($"[ApiClient] POST {endpoint} failed: {request.responseCode} {request.error}\n  URL: {url}\n  Body: {responseBody}");
            return null;
        }
        catch (Exception e)
        {
            IsConnected = false;
            Debug.LogWarning($"[ApiClient] POST {endpoint} exception: {e.Message}");
            return null;
        }
    }

    public static string BuildUrl(string baseUrl, string endpoint)
    {
        baseUrl = baseUrl.TrimEnd('/');
        if (!endpoint.StartsWith("/"))
            endpoint = "/" + endpoint;
        return baseUrl + endpoint;
    }
}
