using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DayNight : MonoBehaviour
{

    public GameObject Day;
    public GameObject Night;
    public GameObject Rain;

    public Material SkyboxNight;
    public Material SkyboxDay;
    public Color FogColorNight;
    public Color FogColorDay;


    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown("t"))
        {
            if (Day.activeSelf)
            {
                RenderSettings.skybox = SkyboxNight;
                RenderSettings.fogColor = FogColorNight;
                Night.SetActive(true);
                Day.SetActive(false);
            }
            else
            {
                RenderSettings.skybox = SkyboxDay;
                RenderSettings.fogColor = FogColorDay;
                Night.SetActive(false);
                Day.SetActive(true);
            }
        }

        if (Input.GetKeyDown("r"))
        {
            if (Rain.activeSelf)
            {
                Rain.SetActive(false);
            }
            else
            {
                Rain.SetActive(true);
            }
        }
    }
}
