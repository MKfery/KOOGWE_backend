# 🚗 Koogwe Transport — Backend API

Backend NestJS pour les applications **Passager** et **Chauffeur** · Guyane française

---

## 🛠 Stack technique

| Technologie | Usage |
|-------------|-------|
| **NestJS** | Framework API REST + WebSocket |
| **Neon PostgreSQL** | Base de données serverless |
| **Prisma** | ORM + migrations + types TypeScript |
| **JWT** | Authentification (access 15min + refresh 30j) |
| **Nodemailer** | Envoi OTP par email (SMTP) |
| **Socket.IO** | Temps réel (GPS, chat, alertes course) |
| **Swagger** | Documentation API auto-générée |

---

## 🚀 Installation

### 1. Cloner et installer les dépendances

```bash
git clone <url> koogwe-backend
cd koogwe-backend
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :

```env
# Neon PostgreSQL (https://console.neon.tech)
DATABASE_URL="postgresql://USER:PASS@ep-xxx.eu-west-2.aws.neon.tech/koogwe?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASS@ep-xxx.eu-west-2.aws.neon.tech/koogwe?sslmode=require"

# JWT - générer des secrets forts (ex: openssl rand -base64 64)
JWT_ACCESS_SECRET=votre_secret_access_tres_long
JWT_REFRESH_SECRET=votre_secret_refresh_tres_long

# Email SMTP (Gmail ou Resend recommandé)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=votre@gmail.com
MAIL_PASS=votre_app_password
MAIL_FROM="Koogwe Transport <noreply@koogwe.com>"
```

### 3. Configurer Neon PostgreSQL

1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un projet `koogwe`
3. Copier la **Connection string** (avec `pgbouncer=true`) → `DATABASE_URL`
4. Copier la **Direct connection string** → `DIRECT_URL`

> ⚠️ La `DIRECT_URL` est nécessaire pour Prisma Migrate (ne pas utiliser pgBouncer pour les migrations)

### 4. Initialiser la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer le schéma à Neon (première fois)
npm run prisma:push

# Ou créer une migration versionnée
npm run prisma:migrate
```

### 5. Lancer en développement

```bash
npm run start:dev
```

L'API est disponible sur `http://localhost:3000/api`
La documentation Swagger est sur `http://localhost:3000/api/docs`

---

## 📡 Endpoints API

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/send-otp` | Envoyer OTP par email |
| POST | `/api/auth/verify-otp` | Vérifier OTP → JWT |
| POST | `/api/auth/refresh` | Renouveler les tokens |
| POST | `/api/auth/logout` | Déconnexion |
| POST | `/api/auth/fcm-token` | Enregistrer token push |
| GET | `/api/auth/me` | Profil connecté |

### Users (Passager)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/users/me` | Profil complet |
| PATCH | `/api/users/me` | Modifier profil |
| GET | `/api/users/me/rides` | Historique courses |
| GET | `/api/users/me/notifications` | Notifications |
| PATCH | `/api/users/me/notifications/read-all` | Tout marquer lu |

### Drivers (Chauffeur)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/drivers/profile` | Créer profil chauffeur |
| GET | `/api/drivers/profile` | Mon profil |
| PATCH | `/api/drivers/availability` | En ligne / Hors ligne |
| PATCH | `/api/drivers/location` | Position GPS (HTTP) |
| GET | `/api/drivers/stats` | Statistiques gains |
| GET | `/api/drivers/rides` | Historique courses |
| POST | `/api/drivers/documents` | Soumettre document |
| GET | `/api/drivers/admin/pending` | [ADMIN] Dossiers en attente |
| PATCH | `/api/drivers/admin/:id/approve` | [ADMIN] Valider chauffeur |

### Rides (Courses)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/rides` | Créer une course |
| GET | `/api/rides/available` | Courses disponibles (chauffeur) |
| GET | `/api/rides/:id` | Détail d'une course |
| POST | `/api/rides/:id/accept` | Accepter une course |
| PATCH | `/api/rides/:id/status` | Mettre à jour le statut |
| POST | `/api/rides/:id/verify-pin` | Vérifier le PIN de démarrage |
| POST | `/api/rides/:id/review` | Soumettre une note |

---

## 🔌 WebSocket Events

Connexion : `ws://localhost:3000` avec `{ auth: { token: "Bearer ..." } }`

### Client → Serveur
| Event | Payload | Description |
|-------|---------|-------------|
| `driver:location` | `{ lat, lng, heading?, rideId? }` | Position GPS du chauffeur |
| `driver:availability` | `{ availability: 'ONLINE'\|'OFFLINE' }` | Changer disponibilité |
| `ride:join` | `{ rideId }` | Rejoindre la room d'une course |
| `chat:message` | `{ rideId, content }` | Envoyer un message |

### Serveur → Client
| Event | Description |
|-------|-------------|
| `driver:location` | Position GPS du chauffeur (vers passager) |
| `ride:new` | Nouvelle course disponible (vers chauffeurs) |
| `ride:accepted` | Course acceptée par un chauffeur |
| `ride:status` | Changement de statut de la course |
| `chat:message` | Nouveau message du chat |

---

## 🔐 Flux d'authentification OTP

```
1. POST /auth/send-otp   { email: "user@example.com" }
   → Génère un code 6 chiffres (valide 10 min)
   → Envoie un email stylé avec le code

2. POST /auth/verify-otp { email: "...", code: "482910" }
   → Vérifie le code
   → Retourne { accessToken, refreshToken, user, isNewUser }

3. Utiliser accessToken dans le header : Authorization: Bearer <token>

4. POST /auth/refresh    { refreshToken: "..." }
   → Renouvelle les tokens sans reconnexion

5. POST /auth/logout
   → Invalide le refresh token en base
```

---

## 📊 Schéma de la base de données

```
users ──────────────── passengerRides ──── rides ──── driverRides ─── drivers
  │                                          │                           │
  ├── notifications                          ├── messages            documents
  ├── reviewsGiven                           ├── reviews
  ├── reviewsReceived                        └── payment ──── payments
  └── payments
```

---

## 🌍 Internationalisation emails

Les emails OTP sont traduits en 5 langues :
- 🇫🇷 Français (défaut)
- 🇬🇧 English
- 🇪🇸 Español
- 🇧🇷 Português
- 🌴 Kréyòl guyanais

La langue est déterminée par le champ `language` envoyé dans `POST /auth/send-otp`.

---

## 🚀 Déploiement production

### Variables d'environnement requises
```env
NODE_ENV=production
DATABASE_URL=...     # Neon avec pgbouncer=true
DIRECT_URL=...       # Neon sans pgbouncer
JWT_ACCESS_SECRET=... # openssl rand -base64 64
JWT_REFRESH_SECRET=...
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=resend
MAIL_PASS=re_VOTRE_CLE_API
```

### Build
```bash
npm run build
npm run start
```

### Recommandations
- **Hébergement** : Railway, Render, Fly.io (supporte Node.js + WebSocket)
- **Email** : [Resend](https://resend.com) (fiable, plan gratuit 100 emails/jour)
- **Monitoring** : Sentry pour les erreurs
- **Logs** : Papertrail ou Logtail
