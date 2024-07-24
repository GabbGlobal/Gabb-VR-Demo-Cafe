using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Billboard : MonoBehaviour
{


    [System.Serializable]
    public class AdvertList
    {
        public Texture Advert;
        public Color LightColor;
    }

    public AdvertList[] Adverts;

    public Light MainLight;

    private Material mat;

    public float MinimumAdvertTime = 5.0f;
    public float MaximumAdvertTime = 10.0f;

    void Start()
    {

        mat = GetComponent<Renderer>().material;
        ChangeAdd();
        
    }

    IEnumerator StartEffect()
    {
        // Increases scan lines before switching the image.

        yield return new WaitForSeconds(Random.Range(MinimumAdvertTime, MaximumAdvertTime));
        yield return new WaitForSeconds(0.5f);
        ChangeAdd();

    }
    void ChangeAdd()
    {
        // Switches the image the sets the scan lines back to normal.
        int AddNumb = Random.Range(0, Adverts.Length);

        mat.SetTexture("_MainTex", Adverts[AddNumb].Advert);
        mat.SetTexture("_EmissionMap", Adverts[AddNumb].Advert);
        if (MainLight)
        {
            MainLight.color = Adverts[AddNumb].LightColor;
        }
        StartCoroutine(StartEffect());
    }

}
