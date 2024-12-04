using System;
using System.Text;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

public class JWTUtil
{
    // Decode the JWT payload using Newtonsoft.Json
    public static JObject DecodeJWT(string jwt)
    {
        try
        {
            // JWT is in the format: header.payload.signature
            var parts = jwt.Split('.');
            if (parts.Length != 3)
            {
                throw new ArgumentException("Invalid JWT format.");
            }

            // Decode the payload (Base64 URL encoding)
            string payload = parts[1];
            string decodedPayload = Base64UrlDecode(payload);

            // Parse the JSON payload using Newtonsoft.Json
            return JObject.Parse(decodedPayload);
        }
        catch (Exception ex)
        {
            UnityEngine.Debug.LogError($"Error decoding JWT: {ex.Message}");
            return null;
        }
    }

    // Helper method to decode Base64Url strings
    private static string Base64UrlDecode(string input)
    {
        string paddedInput = input.Replace('-', '+').Replace('_', '/');
        switch (paddedInput.Length % 4)
        {
            case 2: paddedInput += "=="; break;
            case 3: paddedInput += "="; break;
        }
        var bytes = Convert.FromBase64String(paddedInput);
        return Encoding.UTF8.GetString(bytes);
    }

    // Get time when token will expire
    public static System.DateTime? GetTokenExpiration(string jwt)
    {
        var decodedJWT = DecodeJWT(jwt);

        if (decodedJWT != null && decodedJWT.ContainsKey("exp"))
        {
            // "exp" is the Unix epoch timestamp when the token expires
            long expTimestamp = decodedJWT.Value<long>("exp");
            var tokenExpirationTime = DateTimeOffset.FromUnixTimeSeconds(expTimestamp).UtcDateTime;

            UnityEngine.Debug.Log($"Token expires at: {tokenExpirationTime}");
            return tokenExpirationTime;
        }
        else
        {
            UnityEngine.Debug.LogError("Expiration time not found in JWT payload.");
            return null;
        }
    }
}
