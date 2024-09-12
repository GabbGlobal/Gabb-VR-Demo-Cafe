## About
This project is an immersive, dialogue-based language learning application designed to help users improve their language skills through interactive conversations with virtual characters. 

## Detailed features and functionality

1. The scene is a 3D room. There is 1 user. The user can move and rotate. There are 4 characters: Julia, Ali, Lola, and Seth. The characters cannot move.

2. The character faces the user if (1) the character is closest to the user, and (2) the character is within the specified distance to the user, and (3) the character is within the view of the user, and (4) the user is not in dialogue with a different character.

3. The dialogue screen appears between the user and the character if (1) the user presses space, and (2) the character is closest to the user, and (2) the character is within a specified distance to the user, and (3) the closest within the view of the user, and (4) the user is not in dialogue with anyone.

4. The dialogue text advances if (1) the user presses space, and (2) the character is closest to the user, and (2) the character is within a specified distance to the user, and (3) the closest within the view of the user, and (4) the user is in dialogue with the character.

5. The dialogue screen disappears if (1) the user presses space at the last text of the dialogue, or (2) the user moves outside the specified distance to the character.

6. The dialogue character audio plays when the dialogue screen appears or the dialogue text advances.

7. The dialogue user text becomes green if the user pronounces the dialogue user text correctly.

8. The dialogue user text becomes red if the user pronounces the dialogue user text incorrectly.

9. The advisor text appears with appropriate messages based on the user's pronunciation accuracy.

10. The advisor text disappears if the dialogue text advances or a new conversation starts.

11. The dialogue restarts from the beginning if the user pronounces the dialogue user text incorrectly three times consecutively.

12. The experience bar size increases by 3 points for each dialogue, regardless of performance.

13. The user gains experience points based on their pronunciation accuracy and hint usage:
   - 3 points for correct pronunciation on the first try without a hint
   - 2 points for correct pronunciation on the second try without a hint
   - 1 point for correct pronunciation on the third try without a hint
   - Half of the above points if a hint was used

14. The hint button appears next to the dialogue screen if there is user dialogue text to pronounce.

15. The hint button disappears if the dialogue screen disappears.

16. The hint video appears if the user clicks the hint button.

17. The hint video disappears when it finishes playing.

18. The ending screen appears if the user finishes the dialogue with all characters.

19. The ending medal is gold, and the ending message is "Spectacular work! You've got the gift of gab." if the user has 90% or more experience.The ending medal is silver, and the ending message is "Well done. Keep up the good work." if the user has 75% or more and less than 90% experience. The ending medal is bronze, and the ending message is "You're getting there, just keep practicing." if the user has less than 75% experience.

20. The game restarts if the user clicks the ending restart button.

21. The experience bar appears at the top left corner always.

22. NPCs face the user when in range and return to their original rotation when the user moves away.

23. Dialogues end automatically if the user moves too far from the NPC.

24. The game now includes a dictionary feature:
    - Words in the dialogue text can be hovered over to display their meaning and part of speech.
    - A popup appears near the word with this information.

25. A pronunciation assessment system has been implemented:
    - It starts after the character's audio finishes playing.
    - It assesses the user's pronunciation of the dialogue text.

26. The code now supports multiple languages.


Note: The actual pronunciation assessment is implemented in a separate PronunciationAssessor script, which is added as a component to the game object.
    
