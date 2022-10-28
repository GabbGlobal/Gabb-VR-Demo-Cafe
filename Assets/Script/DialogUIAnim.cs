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
        interactionManager.SetText(speaker);
    }

    IEnumerator PopupAnim()
    {

        while (scale.x < 1)
        {
            transform.localScale = scale;
            yield return new WaitForEndOfFrame();
            scale.x += 0.1f;
        }
        transform.localScale = Vector3.one;

        yield return new WaitForEndOfFrame();

        interactionManager.SetText(speaker);
    }
}