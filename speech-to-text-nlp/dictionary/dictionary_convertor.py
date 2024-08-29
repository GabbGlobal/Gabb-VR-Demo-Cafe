key_phrases = [
]

result_dict = {}

for phrase in key_phrases:
    key, rest = phrase.split(": ")
    pos, meaning = rest.split(") ")
    pos = pos.replace("(", "")
    result_dict[key] = {
        "POS": pos,
        "Meaning": meaning
    }

print(result_dict)
