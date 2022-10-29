using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using Newtonsoft.Json;
using UnityEditorInternal;

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
    NpcTalking npcTalking;
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
        Debug.Log("lessons: " + lessons );

        startSpeaker = data.english[lessons].start;
        dialogData = data.english[lessons].dialog;
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            //test

            if (completeDialog)
            {
                for (int i = 0; i < text.Length; i++)
                {
                    //reset text
                    text[i].SetActive(false);
                }

                //continued dialog
                progress++;
                if (progress > dialogData.Count-1)
                {
                    //end lesson
                    progress = 0;
                    gameManager.UpdateLessons();
                    EndConv();
                }
                else
                {
                    StartConv();
                }
                completeDialog = false;
            }
            else
            { 
                StartConv(testNPC);
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
  
        Debug.Log("progress: "+progress);

        if (_npcName != null)
        {
            Debug.Log(_npcName);

            npcTalking = _npcName.GetComponent<NpcTalking>();
            if (npcTalking == null)
            {
                Debug.LogError("npctalking is null");
            }
            npcTalking.Talk(true);
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
    void EndConv() 
    {
        foreach (var panel in dialogPanel)
        {
            panel.SetActive(false);
            
        }
        npcTalking.Talk(false);
        npcTalking = null;

        GetJsonData();
    }
    public void SetText1(int _speaker) 
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

    }


    public void SetText2(int _speaker)
    {
        
        // if first half of dialog
        if (_speaker == CheckSpeaker())
        {
            int newSpeaker = (CheckSpeaker() - 1) * -1;
            //new speaker

            if (dialogPanel[newSpeaker].activeSelf)
            {
                UIAnim[newSpeaker].UIDisplay();
            }
            else
            {
                dialogPanel[newSpeaker].SetActive(true);
            }
        }
        else //secondhalf of dialog
        {
            Debug.Log("complete");
            completeDialog = true;
        }
    }
}


