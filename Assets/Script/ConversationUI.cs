using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class ConversationUI : MonoBehaviour
{

    [SerializeField] private GameObject player;
    [SerializeField] private GameObject NPC;
    //English dialogInJson;
    private int sentence;
    private int turn;

    [SerializeField] private float yOffset;

    private void Start()
    {
        //InteractionManager.interact += StartGame;
        //dialogInJson = JsonUtility.FromJson<English>(jsonFile.text);
        //InteractionManager.interact += StartConv;
    }

    public void StartConv(GameObject _NPC)
    {
        transform.SetParent(null);
        NPC = _NPC;
        //Vector3 _pos = NPC.transform.position;
        //_pos.y = yOffset;
        var npcTalking = NPC.GetComponent<NpcTalking>();
        transform.position = npcTalking.placeUIHere.position;
        transform.rotation = npcTalking.placeUIHere.rotation;
        transform.SetParent(npcTalking.placeUIHere);

    }

    private void OnDisable()
    {
        //transform.SetParent(null);
       // InteractionManager.interact -= StartConv;
    }
}
