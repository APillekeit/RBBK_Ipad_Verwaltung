# 🧹 Cleanup verwaiste Daten - Anleitung

## 📋 Was ist "Cleanup verwaiste Daten"?

Nach dem Löschen eines Benutzers können manchmal iPads, Schüler oder andere Daten "verwaist" zurückbleiben - sie gehören zu einem User, der nicht mehr existiert.

**Folge:** Diese iPads können nicht mehr hochgeladen werden (ITNr blockiert), obwohl der User gelöscht wurde.

**Lösung:** Der Cleanup-Button löscht alle verwaisten Daten sicher.

---

## 🎯 Wann verwenden?

**Symptom:** Du kannst ein iPad nicht hochladen, weil die ITNr "bereits existiert", obwohl du den User gelöscht hast.

**Beispiel:**
```
❌ Fehler: iPad IT9082 already exists
```

Aber der User, dem das iPad gehörte, existiert nicht mehr!

---

## ✅ Wie ausführen?

### **Methode 1: Button im Admin-Bereich (EINFACH)**

1. **Login als Admin**
   - Gehe zur Anwendung
   - Melde dich als Admin an

2. **Gehe zu "Benutzerverwaltung"**
   - Klicke auf den Tab "Benutzerverwaltung"
   
3. **Klicke auf "Cleanup verwaiste Daten"**
   - Button mit Mülleimer-Icon
   - Orange umrandet
   - Neben "Neuer Benutzer"

4. **Bestätige den Dialog**
   - Lies die Warnung
   - Klicke "OK"

5. **Warte auf Bestätigung**
   - Toast-Nachricht zeigt Ergebnis:
     ```
     ✅ Cleanup abgeschlossen!
     iPads: 44
     Schüler: 0
     Zuordnungen: 0
     Verträge: 39
     ```

6. **Fertig!**
   - Alle ITNr sind jetzt wieder verfügbar

---

### **Methode 2: Via API (FORTGESCHRITTEN)**

Falls du es manuell ausführen willst:

```bash
# 1. Als Admin einloggen und Token holen
TOKEN=$(curl -s -X POST "http://localhost/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"IHR_PASSWORT"}' | \
  python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# 2. Cleanup ausführen
curl -X POST "http://localhost/api/admin/cleanup-orphaned-data" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Orphaned data cleanup completed",
  "deleted_resources": {
    "ipads": 44,
    "students": 0,
    "assignments": 0,
    "contracts": 39
  },
  "details": {
    "orphaned_ipad_itnrs": ["IT9082", "IT7215", ...],
    "total_orphaned_ipads": 44
  }
}
```

---

## 🔒 Sicherheit

### **Ist es sicher?**
✅ **JA!** Der Cleanup löscht nur:
- iPads von **nicht existierenden** Usern
- Schüler von **nicht existierenden** Usern
- Zuordnungen von **nicht existierenden** Usern
- Verträge von **nicht existierenden** Usern

❌ **NICHT** gelöscht werden:
- Daten von aktiven Usern
- Daten von deaktivierten Usern (die noch existieren)

### **Kann ich es rückgängig machen?**
❌ **NEIN!** Die Löschung ist permanent.

Aber: Es werden nur verwaiste Daten gelöscht, die sowieso nicht mehr gebraucht werden.

---

## 📊 Was passiert genau?

**Schritt 1:** System findet alle existierenden User-IDs
```
User IDs: [admin-id, user1-id, user2-id, ...]
```

**Schritt 2:** System findet iPads, die NICHT zu diesen Users gehören
```
Verwaiste iPads: [IT9082, IT7215, ...] (gehören zu gelöschtem User)
```

**Schritt 3:** System löscht alle verwaisten Daten
```
Gelöscht: 44 iPads, 0 Schüler, 0 Zuordnungen, 39 Verträge
```

**Schritt 4:** ITNr sind wieder verfügbar!
```
✅ IT9082 kann jetzt wieder hochgeladen werden
```

---

## ❓ Häufige Fragen

**Q: Wie oft soll ich Cleanup ausführen?**  
A: Nur wenn du Probleme mit "already exists" Fehlern hast, obwohl der User gelöscht wurde.

**Q: Was wenn ich versehentlich klicke?**  
A: Es gibt einen Bestätigungs-Dialog. Ohne Bestätigung passiert nichts.

**Q: Werden aktive User-Daten gelöscht?**  
A: NEIN! Nur Daten von nicht existierenden Usern.

**Q: Wie sehe ich welche iPads gelöscht werden?**  
A: Im Response (Toast oder Browser-Konsole) stehen die ersten 10 ITNr.

**Q: Muss ich Cleanup vor jedem User-Löschen ausführen?**  
A: NEIN! User-Löschung sollte automatisch aufräumen. Cleanup ist nur für alte verwaiste Daten.

---

## 🎯 Zusammenfassung

### **Wann:**
- ITNr "already exists" Fehler trotz User-Löschung
- Nach Migrations/Datenbank-Problemen
- Einmalig nach Updates

### **Wie:**
1. Login als Admin
2. Tab "Benutzerverwaltung"
3. Button "Cleanup verwaiste Daten"
4. Bestätigen
5. Fertig!

### **Ergebnis:**
✅ Alle verwaisten iPads gelöscht  
✅ ITNr wieder verfügbar  
✅ Datenbank aufgeräumt  

**Einfach, sicher, schnell!** 🚀
