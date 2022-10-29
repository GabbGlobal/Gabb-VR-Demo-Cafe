using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class NpcTalking : MonoBehaviour
{
    
    private GameObject player;
    private bool talking = false;
    private Animator animator;
    // Start is called before the first frame update
    void Start()
    {
        player = GameObject.FindGameObjectsWithTag("MainCamera")[0];
        animator = GetComponent<Animator>();
        if (animator == null)
        {
            Debug.LogError("animator is null");
        }
    }

    // Update is called once per frame
    void Update()
    {
        if (talking)
        {
            Vector3 _cam = new Vector3(player.transform.position.x, transform.position.y, player.transform.position.z);
            transform.LookAt(_cam);
        }
    }
    public void Talk(bool _talk)
    {
        talking = _talk;
        if (talking)
        {
            animator.SetInteger("talking", Random.Range(0, 1));
            animator.SetTrigger("Talk");
        }
    }
}
