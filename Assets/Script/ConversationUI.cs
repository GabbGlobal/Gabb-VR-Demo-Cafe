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
    private void Update()
    {
        Vector3 _cam = new Vector3(player.transform.position.x, transform.position.y, player.transform.position.z);
        transform.LookAt(_cam);
        //point normal to player
    }


    public void StartConv(GameObject _NPC)
    {
        NPC = _NPC;
        Vector3 _pos = NPC.transform.position;
        _pos.y = yOffset;
        transform.position = _pos;

    }

    private void OnDisable()
    {
       // InteractionManager.interact -= StartConv;
    }
}
