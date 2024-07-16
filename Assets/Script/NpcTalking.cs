using System.Collections;
using UnityEngine;

public class NpcTalking : MonoBehaviour
{
    private GameObject player;
    private bool talking = false;
    private Animator animator;
    private Quaternion originalRotation;
    private Coroutine turnBackCoroutine;
    private Coroutine faceUserCoroutine;

    void Start()
    {
        player = GameObject.FindGameObjectsWithTag("MainCamera")[0];
        animator = GetComponent<Animator>();
        if (animator == null)
        {
            Debug.LogError("animator is null");
        }
        originalRotation = transform.rotation;
    }

    void Update()
    {
        if (talking)
        {
            FaceUserInstantly();
        }
    }

    public void Talk(bool _talk)
    {
        talking = _talk;

        if (talking)
        {
            animator.SetInteger("talking", Random.Range(0, 1));
            animator.SetTrigger("Talk");
            if (turnBackCoroutine != null)
            {
                StopCoroutine(turnBackCoroutine);
            }
        }
        else
        {
            animator.ResetTrigger("Talk");
        }
    }

    public void FaceUser(bool face)
    {
        if (face)
        {
            if (faceUserCoroutine != null)
            {
                StopCoroutine(faceUserCoroutine);
            }
            faceUserCoroutine = StartCoroutine(SmoothFaceUser());
        }
    }

    private IEnumerator SmoothFaceUser()
    {
        while (true)
        {
            Vector3 targetDirection = player.transform.position - transform.position;
            targetDirection.y = 0; // Keep the rotation in the horizontal plane
            Quaternion targetRotation = Quaternion.LookRotation(targetDirection);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime * 4.0f);
            yield return null;
        }
    }

    public void ReturnToOriginalRotation()
    {
        if (faceUserCoroutine != null)
        {
            StopCoroutine(faceUserCoroutine);
        }
        if (turnBackCoroutine != null)
        {
            StopCoroutine(turnBackCoroutine);
        }
        turnBackCoroutine = StartCoroutine(SmoothReturnToOriginalRotation());
    }

    private IEnumerator SmoothReturnToOriginalRotation()
    {
        float duration = 0.5f; // Duration of the turn back
        float elapsed = 0f;
        Quaternion startRotation = transform.rotation;

        while (elapsed < duration)
        {
            transform.rotation = Quaternion.Slerp(startRotation, originalRotation, elapsed / duration);
            elapsed += Time.deltaTime;
            yield return null;
        }

        transform.rotation = originalRotation; // Ensure exact original rotation at the end
    }

    private void FaceUserInstantly()
    {
        Vector3 targetDirection = player.transform.position - transform.position;
        targetDirection.y = 0; // Keep the rotation in the horizontal plane
        transform.rotation = Quaternion.LookRotation(targetDirection);
    }
}