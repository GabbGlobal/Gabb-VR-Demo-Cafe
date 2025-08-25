using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DialogUIAnim : MonoBehaviour
{

    private Vector3 scale = new Vector3(0, 1, 1);

    [SerializeField]
    private InteractionManager interactionManager;
    [SerializeField]
    private int speaker = 0;
    //0=player 1 = npc
    private void OnEnable()
    {
        StartCoroutine(PopupAnim());
        //tmp = transform.GetChild(1).gameObject;

    }
    public void UIDisplay() {
        //Debug.Log("STUTTERBUG: UIDisplay calling SetText1");
        //interactionManager.SetText1(speaker);
    }

    IEnumerator PopupAnim()
    {
        WaitForEndOfFrame _wait = new WaitForEndOfFrame();

        while (scale.x < 1)
        {
            transform.localScale = scale;
            yield return _wait;
            scale.x += 0.1f;
        }
        transform.localScale = Vector3.one;

        yield return _wait;
        //Debug.Log("STUTTERBUG: PopupAnim calling SetText1");
        //interactionManager.SetText1(speaker);
    }
}