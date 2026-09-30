**Contrat API IA QCM**

Base URL:
```text
http://100.65.208.122:8000
```

Endpoint:
```text
POST /analyze
```

Methode HTTP:
```text
POST
```

Content-Type attendu:
```text
multipart/form-data
```

Champ fichier attendu:
```text
file
```

Types de fichiers attendus:
```text
jpg, jpeg, png, bmp
```

Exemple de requete:
```bash
curl -X POST "http://100.65.208.122:8000/analyze" -F "file=@image.jpg"
```

**Reponse succes**

Code:
```text
200 OK
```

Exemple:
```json
{
  "nom_complet": "Nom Prenom",
  "id": "123456",
  "q1": "A",
  "q2": "BC",
  "q3": "",
  "q4": "D",
  "q5": "",
  "q6": "A"
}
```

Regles:
- `nom_complet`: string
- `id`: string
- `q1` a `q60`: string
- aucune case cochee: `""`
- une seule case cochee: `"A"`
- plusieurs cases cochees: `"BC"`, `"AC"`, `"ABD"`

Format des choix multiples:
```json
"q2": "BC"
```

**Reponse erreur**

Codes HTTP possibles:
```text
400 Bad Request
422 Unprocessable Entity
500 Internal Server Error
```

Exemple:
```json
{
  "error": {
    "code": "invalid_image_format",
    "message": "Le fichier envoye n'est pas une image valide."
  }
}
```

Exemples de `error.code`:
- `empty_file`
- `invalid_image`
- `invalid_image_format`
- `sheet_alignment_failed`
- `info_box_not_detected`
- `qcm_model_init_failed`
- `id_model_init_failed`
- `boxes_init_failed`
- `easyocr_init_failed`
- `internal_server_error`

**Non fourni actuellement**

L'API ne renvoie pas pour l'instant:
- score de confiance
- confidence par reponse
- overlay image
- debug image path
- base64 image de sortie

**Usage cote web**

La reponse suffit pour:
- matcher l'etudiant avec `id`
- comparer `q1..q60` avec la grille en base
- calculer le score
- sauvegarder le resultat
- afficher les reponses dans le site

**Schema technique TypeScript**

Succes:
```ts
type AnalyzeSuccess = {
  nom_complet: string;
  id: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
  q11: string;
  q12: string;
  q13: string;
  q14: string;
  q15: string;
  q16: string;
  q17: string;
  q18: string;
  q19: string;
  q20: string;
  q21: string;
  q22: string;
  q23: string;
  q24: string;
  q25: string;
  q26: string;
  q27: string;
  q28: string;
  q29: string;
  q30: string;
  q31: string;
  q32: string;
  q33: string;
  q34: string;
  q35: string;
  q36: string;
  q37: string;
  q38: string;
  q39: string;
  q40: string;
  q41: string;
  q42: string;
  q43: string;
  q44: string;
  q45: string;
  q46: string;
  q47: string;
  q48: string;
  q49: string;
  q50: string;
  q51: string;
  q52: string;
  q53: string;
  q54: string;
  q55: string;
  q56: string;
  q57: string;
  q58: string;
  q59: string;
  q60: string;
};
```

Erreur:
```ts
type AnalyzeError = {
  error: {
    code: string;
    message: string;
  };
};
```

Union:
```ts
type AnalyzeResponse = AnalyzeSuccess | AnalyzeError;
```

**Schema JSON simplifie**

Succes:
```json
{
  "type": "object",
  "required": ["nom_complet", "id"],
  "additionalProperties": true,
  "properties": {
    "nom_complet": { "type": "string" },
    "id": { "type": "string" }
  }
}
```

Erreur:
```json
{
  "type": "object",
  "required": ["error"],
  "properties": {
    "error": {
      "type": "object",
      "required": ["code", "message"],
      "properties": {
        "code": { "type": "string" },
        "message": { "type": "string" }
      }
    }
  }
}
```
