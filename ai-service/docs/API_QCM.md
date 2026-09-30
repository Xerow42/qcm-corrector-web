API locale pour analyser une feuille QCM scannee.

Lancement:

```bash
pip install -r api_requirements.txt
python run_api.py
```

Endpoint principal:

```bash
POST /analyze
Content-Type: multipart/form-data
```

Champ attendu:

- `file`: photo/image scannee de la feuille

Exemple `curl`:

```bash
curl -X POST "http://127.0.0.1:8000/analyze" ^
  -F "file=@api_qcm/feuille78.jpg"
```

Exemple de reponse:

```json
{
  "nom_complet": "Lina Example",
  "id": "123456",
  "q1": "A",
  "q2": "",
  "q3": "D"
}
```

Exemple de reponse d'erreur:

```json
{
  "error": {
    "code": "invalid_image_format",
    "message": "Le fichier envoye n'est pas une image valide."
  }
}
```

Notes:

- Le pipeline utilise uniquement les fichiers presents dans `api_qcm`.
- Les modeles, les coordonnees et EasyOCR sont charges au demarrage de l'API.
- La sortie remplit toujours `q1` a `q60`.
- La reponse JSON correspond au dictionnaire affiche par `merge_student_sheet.py`.
- Les erreurs sont renvoyees en JSON avec `error.code` et `error.message`.
