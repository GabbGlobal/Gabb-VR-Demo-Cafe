using System;
using System.Collections;
using System.Threading;
using UnityEngine;

// Just scratch or fixing an async bug

public class AsyncDebug : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    CancellationTokenSource counterCancel;
    void Start()
    {
        //StartCoroutine(BeginCounting());
        counterCancel = new CancellationTokenSource();
        Counter(counterCancel.Token);
        counterCancel.Cancel();
        //Awaitable aw = Counter();
        //aw.Cancel();
        //Debug.Log(aw.IsCompleted);
        //counterAwaitable.Cancel();
    }

    async Awaitable Counter(CancellationToken cancellationToken) {
        try {
            for (int i = 0; i < 100; i++) {
                if (cancellationToken.IsCancellationRequested) {
                    return;
                }
                Debug.Log(i);
            
                await Awaitable.WaitForSecondsAsync(4f);
            }
        } catch (Exception e) {
            if (e is OperationCanceledException) {
                return;
            } else {
                Debug.Log("EEEEE");
                Debug.LogException(e);
                throw e;
            }
        }
    }
}
