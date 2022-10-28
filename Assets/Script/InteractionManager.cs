using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using Newtonsoft.Json;


public class InteractionManager : MonoBehaviour
{
    // Start is called before the first frame update
    //public delegate void Interact();
    //public static event Interact interact;

    //public delegate void Listening();
    //public static event Listening listening;

    public delegate void ShowText();
    public static event ShowText showText;
    GameManager gameManager;

    private string language;
    private int progress =0;
    private int lessons;

    [SerializeField]
    ConversationUI conversationUI;
    [SerializeField]
    DialogUIAnim[] UIAnim;
    [SerializeField]
    private GameObject[] dialogPanel;
    [SerializeField]
    private GameObject[] text;
    [SerializeField]
    private loadDialog[] loadDialog;

    [SerializeField]
    private TextAsset jsonFile;
    Root dialogInJson;

    //private string[][] dialogData;
    private List<List<string>> dialogData;
    private string startSpeaker;
    [SerializeField]
    GameObject testNPC;
    bool completeDialog = false;

    void Start()
    {
        

        gameManager = GetComponent<GameManager>();
        if (gameManager == null)
        {
            Debug.LogError("gamemanager is null");
        }
        language = gameManager.language;
        GetJsonData();
    }
    void GetJsonData() {
        lessons = gameManager.lesson;
        //lessons = 1;
        string _json = jsonFile.ToString();
        var data = Newtonsoft.Json.JsonConvert.DeserializeObject<Root>(_json);

        startSpeaker = data.english[lessons].start;
        dialogData = data.english[lessons].dialog;
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        { 
            //test
            StartConv(testNPC);
            if (completeDialog) {

                for (int i = 0; i < text.Length; i++)
                {
                    text[i].SetActive(false);
                }


                progress++;
                StartConv();
                completeDialog = false;

            }
        }
    }

    int CheckSpeaker() {
        //check who speaks first
        if (startSpeaker == "npc")
        {
            return 1;
        }
        else { return 0; }
    }
    void StartConv(GameObject _npcName = null)
    {
        if (_npcName != null)
        {
            conversationUI.StartConv(_npcName);
            //position ui canvas

            // if npc speaks first, display npc menu
            dialogPanel[CheckSpeaker()].SetActive(true);
            // anim plays onenable
        }
        else {
            UIAnim[CheckSpeaker()].UIDisplay();
        }

    }
    public void SetText(int _speaker) 
    {
        text[_speaker].SetActive(true);
        Debug.Log(CheckSpeaker() +" "+_speaker);
        int _n = _speaker;
        if (CheckSpeaker() == 1)
        {
            //get the right data
            _n = (_n - 1)*-1;
        }
        string _text = dialogData[progress][_n];
        //display text
        loadDialog[_speaker].UpdateText(_text);

        // if first half of dialog
        if (_speaker == CheckSpeaker())
        {
            int newSpeaker = (CheckSpeaker() - 1) * -1;
            //new speaker

            dialogPanel[newSpeaker].SetActive(true);
            if (dialogPanel[newSpeaker].activeSelf)
            {
                UIAnim[newSpeaker].UIDisplay();
            }
        }
        else //secondhalf of dialog
        {
            completeDialog = true;
        }
    }

 

}


