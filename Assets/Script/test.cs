using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class test : MonoBehaviour
{
    // Start is called before the first frame update
    void Start()
    {
        Debug.Log("start");
    }
    private void Awake()
    {
        Debug.Log("Awake");

    }
    private void OnEnable()
    {
        Debug.Log("enable");

    }
    // Update is called once per frame
    void Update()
    {
        
    }
    void testRun() { }
}
