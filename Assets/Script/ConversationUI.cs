using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class ConversationUI : MonoBehaviour
{

    [SerializeField] private GameObject _gamePanel;
    
    public void StartGame()
    {
        _gamePanel.SetActive(true);
    }
}
