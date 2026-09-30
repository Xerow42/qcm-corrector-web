**Contrat API iOS Swift QCM**

Base URL verifiee sur le PC serveur:
```text
http://127.0.0.1:8000
```

Preuve de fonctionnement fournie:
- commande executee sur le PC qui heberge l'API:

```text
curl -X POST "http://127.0.0.1:8000/analyze" -F "file=@page_1.png"
```

Resultat observe:
- log serveur:

```text
INFO: 127.0.0.1:55026 - "POST /analyze HTTP/1.1" 200 OK
```

Conclusion pratique:
- sur la machine serveur, l'API repond bien sur `127.0.0.1:8000`
- pour une application iOS, `127.0.0.1` ne doit pas etre utilise, car sur iPhone cela pointera vers l'iPhone lui-meme
- il faut remplacer `127.0.0.1` par l'IP reseau du PC serveur, en gardant le port `8000`

Exemple attendu pour iPhone si le PC serveur a pour IP `100.65.208.122`:
```text
http://100.65.208.122:8000/analyze
```

Incoherence a noter dans le repo:
- [run_api.py](/z:/Desktop/QCM/run_api.py:1) indique `port=5000`
- [launch_api_tf.sh](/z:/Desktop/QCM/launch_api_tf.sh:1) annonce un demarrage sur `0.0.0.0:8000`
- comme ton test reel retourne `200 OK` sur `127.0.0.1:8000`, il faut considerer `8000` comme la verite d'execution actuelle

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

Types de fichiers recommandes pour iOS:
```text
jpg, jpeg, png
```

Formats d'image a envoyer depuis iPhone:
- photo prise avec l'appareil puis convertie en `jpeg`
- image choisie depuis la galerie en `jpeg` ou `png`

Exemple HTTP:
```bash
curl -X POST "http://100.65.208.122:8000/analyze" -F "file=@scan.jpg"
```

**Reponse succes**

Code:
```text
200 OK
```

Exemple reel fourni:
```json
{
  "nom_complet": "LinA",
  "id": "013547",
  "q1": "A",
  "q21": "A",
  "q41": "A",
  "q2": "B",
  "q22": "A",
  "q42": "B",
  "q3": "D",
  "q23": "B",
  "q43": "C",
  "q4": "B",
  "q24": "B",
  "q44": "B",
  "q5": "C",
  "q25": "C",
  "q45": "C",
  "q6": "B",
  "q26": "C",
  "q46": "",
  "q7": "",
  "q27": "D",
  "q47": "A",
  "q8": "A",
  "q28": "D",
  "q48": "BC",
  "q9": "C",
  "q29": "B",
  "q49": "C",
  "q10": "D",
  "q30": "B",
  "q50": "B",
  "q11": "B",
  "q31": "A",
  "q51": "",
  "q12": "A",
  "q32": "A",
  "q52": "B",
  "q13": "B",
  "q33": "B",
  "q53": "A",
  "q14": "CD",
  "q34": "C",
  "q54": "D",
  "q15": "D",
  "q35": "D",
  "q55": "C",
  "q16": "B",
  "q36": "A",
  "q56": "B",
  "q17": "A",
  "q37": "B",
  "q57": "A",
  "q18": "C",
  "q38": "C",
  "q58": "B",
  "q19": "B",
  "q39": "D",
  "q59": "C",
  "q20": "C",
  "q40": "A",
  "q60": "D"
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

**Modeles Swift proposes**

Succes:
```swift
struct AnalyzeSuccess: Decodable {
    let nomComplet: String
    let id: String
    let q1: String
    let q2: String
    let q3: String
    let q4: String
    let q5: String
    let q6: String
    let q7: String
    let q8: String
    let q9: String
    let q10: String
    let q11: String
    let q12: String
    let q13: String
    let q14: String
    let q15: String
    let q16: String
    let q17: String
    let q18: String
    let q19: String
    let q20: String
    let q21: String
    let q22: String
    let q23: String
    let q24: String
    let q25: String
    let q26: String
    let q27: String
    let q28: String
    let q29: String
    let q30: String
    let q31: String
    let q32: String
    let q33: String
    let q34: String
    let q35: String
    let q36: String
    let q37: String
    let q38: String
    let q39: String
    let q40: String
    let q41: String
    let q42: String
    let q43: String
    let q44: String
    let q45: String
    let q46: String
    let q47: String
    let q48: String
    let q49: String
    let q50: String
    let q51: String
    let q52: String
    let q53: String
    let q54: String
    let q55: String
    let q56: String
    let q57: String
    let q58: String
    let q59: String
    let q60: String

    enum CodingKeys: String, CodingKey {
        case nomComplet = "nom_complet"
        case id
        case q1, q2, q3, q4, q5, q6, q7, q8, q9, q10
        case q11, q12, q13, q14, q15, q16, q17, q18, q19, q20
        case q21, q22, q23, q24, q25, q26, q27, q28, q29, q30
        case q31, q32, q33, q34, q35, q36, q37, q38, q39, q40
        case q41, q42, q43, q44, q45, q46, q47, q48, q49, q50
        case q51, q52, q53, q54, q55, q56, q57, q58, q59, q60
    }
}
```

Erreur:
```swift
struct APIErrorResponse: Decodable {
    let error: APIErrorDetail
}

struct APIErrorDetail: Decodable, Error {
    let code: String
    let message: String
}
```

Alternative recommandee cote app:
```swift
struct AnalyzeResult: Decodable {
    let nomComplet: String
    let id: String
    let answers: [String: String]
}
```

Note:
- l'API renvoie `q1` a `q60` a plat
- cote iOS, il peut etre plus pratique de remapper ces champs dans un dictionnaire `answers`

**Exemple service Swift**

```swift
import Foundation
import UIKit

final class QCMAPIService {
    private let baseURL = URL(string: "http://100.65.208.122:8000")!

    func analyze(image: UIImage) async throws -> AnalyzeSuccess {
        guard let imageData = image.jpegData(compressionQuality: 0.9) else {
            throw URLError(.cannotEncodeContentData)
        }

        let boundary = UUID().uuidString
        var request = URLRequest(url: baseURL.appendingPathComponent("analyze"))
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = makeMultipartBody(
            boundary: boundary,
            fieldName: "file",
            fileName: "scan.jpg",
            mimeType: "image/jpeg",
            fileData: imageData
        )

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        let decoder = JSONDecoder()

        if (200...299).contains(httpResponse.statusCode) {
            return try decoder.decode(AnalyzeSuccess.self, from: data)
        } else {
            let apiError = try decoder.decode(APIErrorResponse.self, from: data)
            throw apiError.error
        }
    }

    private func makeMultipartBody(
        boundary: String,
        fieldName: String,
        fileName: String,
        mimeType: String,
        fileData: Data
    ) -> Data {
        var body = Data()
        let lineBreak = "\r\n"

        body.append("--\(boundary)\(lineBreak)".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(fileName)\"\(lineBreak)".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\(lineBreak)\(lineBreak)".data(using: .utf8)!)
        body.append(fileData)
        body.append(lineBreak.data(using: .utf8)!)
        body.append("--\(boundary)--\(lineBreak)".data(using: .utf8)!)

        return body
    }
}
```

**Bonnes pratiques iOS**

- convertir les images iPhone en `jpeg` avant l'envoi
- compresser legerement l'image pour reduire le temps d'upload
- verifier que le scan est net, bien cadre et bien eclaire
- gerer les erreurs HTTP `400`, `422` et `500`
- afficher `error.message` a l'utilisateur et journaliser `error.code`

**Comment la requete est envoyee**

L'application iOS fait les etapes suivantes:

1. l'utilisateur choisit une image ou prend une photo
2. l'app convertit `UIImage` en donnees binaires, en general avec `jpegData(...)`
3. l'app cree une requete HTTP `POST`
4. l'app ajoute le header:

```text
Content-Type: multipart/form-data; boundary=...
```

5. l'app place l'image dans le body sous le champ:

```text
file
```

6. `URLSession.shared.data(for: request)` envoie la requete au serveur
7. le serveur traite l'image puis renvoie un JSON

Representation simplifiee de la requete:

```http
POST /analyze HTTP/1.1
Host: 100.65.208.122:8000
Content-Type: multipart/form-data; boundary=XYZ

--XYZ
Content-Disposition: form-data; name="file"; filename="scan.jpg"
Content-Type: image/jpeg

[donnees binaires de l'image]
--XYZ--
```

**Comment savoir que l'API a bien recu et renvoye une reponse**

Dans Swift, tu le sais a 3 niveaux:

1. si `URLSession.shared.data(for: request)` ne lance pas d'erreur reseau, la connexion HTTP a eu lieu
2. si tu recois un `HTTPURLResponse`, le serveur a bien renvoye un code HTTP
3. si le `JSONDecoder` decode correctement la reponse, alors l'API a renvoye un JSON valide

Exemple de verification:

```swift
let (data, response) = try await URLSession.shared.data(for: request)

guard let httpResponse = response as? HTTPURLResponse else {
    throw URLError(.badServerResponse)
}

print("status =", httpResponse.statusCode)
print("body =", String(data: data, encoding: .utf8) ?? "body unreadable")
```

Interpretation:
- `status = 200` : l'API a accepte l'image et a renvoye un resultat
- `status = 400` ou `422` : l'API a bien repondu, mais refuse ou ne comprend pas l'image
- `status = 500` : l'API a bien repondu, mais a eu une erreur interne
- erreur `URLError` : la requete n'a probablement pas atteint correctement le serveur

**Comment cela doit marcher en pratique**

Pour que l'app iPhone fonctionne correctement, il faut:

1. que le serveur FastAPI tourne
2. qu'il soit accessible depuis le meme reseau que l'iPhone, ou via une IP routable
3. que le bon port soit ouvert
4. que l'URL utilisee dans Swift corresponde exactement a l'adresse exposee

Cas 1:
```text
si le serveur expose vraiment 100.65.208.122:8000
alors l'app doit appeler http://100.65.208.122:8000/analyze
```

Cas 2:
```text
si un proxy expose 100.65.208.122:8000 vers le backend
alors l'app peut appeler http://100.65.208.122:8000/analyze
```

Dans l'etat actuel, ton test manuel confirme le port `8000` comme port d'utilisation reelle.

**Non fourni actuellement**

L'API ne renvoie pas pour l'instant:
- score de confiance
- confidence par reponse
- overlay image
- debug image path
- base64 image de sortie

**Conclusion integration iOS**

Le contrat mobile iOS est identique au contrat web sur le plan reseau:
- meme endpoint
- meme champ `file`
- meme reponse JSON

La seule adaptation cote Swift concerne:
- la construction du `multipart/form-data`
- le decodage `Codable`
- la conversion `UIImage` vers `Data`
