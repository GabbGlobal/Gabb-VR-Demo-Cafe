using System.Collections;
using System.Collections.Generic;
using UnityEngine;


// Simple data container asset used in conjunction with SecretsManager
// This does not keep secrets out of builds, only helps keep secrets out of git. (similar to a .env)
public class Secrets : ScriptableObject
{
    public string azureSpeechSubscriptionKey = "Fill in key here";
}