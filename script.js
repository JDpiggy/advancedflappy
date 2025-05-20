document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT GRABBING (New elements added) ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const scoreDisplay = document.getElementById('score');
    const highScoreDisplay = document.getElementById('highScore');
    const coinCountDisplay = document.getElementById('coinCount');
    const fuelBar = document.getElementById('fuelBar');

    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const shopScreen = document.getElementById('shopScreen');
    const settingsScreen = document.getElementById('settingsScreen'); 
    const leaderboardScreen = document.getElementById('leaderboardScreen'); 
    const newWorldHighScorePopup = document.getElementById('newWorldHighScorePopup'); 

    const startButton = document.getElementById('startButton');
    const shopButton = document.getElementById('shopButton');
    const leaderboardButton = document.getElementById('leaderboardButton'); 
    const settingsButton = document.getElementById('settingsButton'); 
    
    const restartButton = document.getElementById('restartButton');
    const backToMenuButtonFromShop = document.getElementById('backToMenuButtonFromShop');
    const backToMenuButtonFromSettings = document.getElementById('backToMenuButtonFromSettings'); 
    const backToMenuButtonFromLeaderboard = document.getElementById('backToMenuButtonFromLeaderboard'); 

    const finalScoreDisplay = document.getElementById('finalScore');
    const coinsEarnedDisplay = document.getElementById('coinsEarned');
    const newHighScoreTextGameOver = document.getElementById('newHighScoreTextGameOver');
    
    // Shop UI
    const shopCoinCountDisplay = document.getElementById('shopCoinCount');
    const shopPanelLeft = document.getElementById('shopPanelLeft');
    const shopCharacterPreviewImage = document.getElementById('shopCharacterPreviewImage');
    const shopCharacterName = document.getElementById('shopCharacterName');
    const shopCharacterPriceStatus = document.getElementById('shopCharacterPriceStatus');

    // Settings UI
    const displayNameInput = document.getElementById('displayNameInput'); 
    const saveDisplayNameButton = document.getElementById('saveDisplayNameButton'); 
    const displayNameStatus = document.getElementById('displayNameStatus'); 
    const masterVolumeSlider = document.getElementById('masterVolumeSlider'); 
    const musicVolumeSlider = document.getElementById('musicVolumeSlider'); 
    const sfxVolumeSlider = document.getElementById('sfxVolumeSlider'); 
    const redeemCodeInput = document.getElementById('redeemCodeInput'); 
    const redeemCodeButton = document.getElementById('redeemCodeButton'); 
    const redeemStatusMessage = document.getElementById('redeemStatusMessage'); 

    // Leaderboard UI
    const leaderboardListContainer = document.getElementById('leaderboardListContainer'); 
    const leaderboardLoadingMsg = document.getElementById('leaderboardLoadingMsg'); 
    const userRankDisplay = document.getElementById('userRankDisplay'); 
    const userScoreDisplay = document.getElementById('userScoreDisplay'); 
    const userNameDisplay = document.getElementById('userNameDisplay'); 
    const scrollToUserButton = document.getElementById('scrollToUserButton'); 
    
    // New World High Score Popup UI
    const closeNewWorldHighScorePopup = document.getElementById('closeNewWorldHighScorePopup'); 


    if (!canvas || !ctx) {
        console.error("CRITICAL ERROR: Canvas or 2D context not found. Game cannot start.");
        return;
    }

    // --- SECURE FIREBASE CONFIG LOADING ---
    // The firebaseConfig.js file is loaded before this script in your HTML and provides window.firebaseConfig.
    // Never commit your real firebaseConfig.js to the repo!
    // Ensure firebaseConfig.js is in .gitignore
    // Reference: .env (for local secrets, not applicable here directly) and firebaseConfig.js (for runtime).

    if (!window.firebaseConfig) {
        console.error("FATAL: window.firebaseConfig not found. Make sure firebaseConfig.js is loaded before script.js and contains your Firebase config.");
        // Optionally, disable Firebase features gracefully or stop the game
        // For now, we'll proceed, but Firebase-dependent features will fail.
    }
    const firebaseConfig = window.firebaseConfig || {}; // Use empty object if not found to avoid immediate error, but Firebase will fail

    let firebaseApp;
    let db; // Firestore instance

    try {
        // Check if firebase global is available (loaded from Firebase SDK script)
        if (typeof firebase !== 'undefined' && firebase.initializeApp) {
            // Check if apiKey is present and not a placeholder
            if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_ACTUAL_API_KEY_HERE" && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") { // Check against common placeholders
                firebaseApp = firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
                console.log("Firebase initialized successfully.");
            } else {
                console.warn("Firebase config not fully provided (API key might be missing or a placeholder). Leaderboard will be disabled.");
            }
        } else {
            console.warn("Firebase SDK (global 'firebase' object) not found. Leaderboard will be disabled.");
        }
    } catch (error) {
        console.error("Error initializing Firebase:", error);
    }


    // --- GAME SETTINGS & GLOBAL VARIABLES ---
    const GAME_WIDTH = 1280; const GAME_HEIGHT = 720;
    canvas.width = GAME_WIDTH; canvas.height = GAME_HEIGHT;

    let rocket, obstacles, powerUps, particles;
    let score = 0, highScore = 0, frame = 0, gameSpeed;
    let gameState = 'LOADING';
    let coins = 0;
    let initialAssetsHaveLoaded = false;
    let localPlayerId = ''; 
    let localPlayerDisplayName = 'Player'; 

    // Volume settings
    let masterVolume = 1.0;
    let musicVolume = 0.3;
    let sfxVolume = 1.0;

    // --- CHARACTER DATA & ASSET PATHS ---
    let charactersData = [
        { id: 'lali_classic', name: 'Lali Classic', imageSrc: 'assets/tiles/lali_classic.png', price: 0, imageObj: new Image(), isReady: false, unlocked: true },
        { id: 'lali_banana', name: 'Banana Lali', imageSrc: 'assets/tiles/banana_lali.png', price: 100, imageObj: new Image(), isReady: false, unlocked: false },
        { id: 'lali_super', name: 'Super Lali', imageSrc: 'assets/tiles/lali_super.png', price: 200, imageObj: new Image(), isReady: false, unlocked: false },
        { id: 'lali_ninja', name: 'Ninja Lali', imageSrc: 'assets/tiles/lali_ninja.png', price: 300, imageObj: new Image(), isReady: false, unlocked: false },
        { id: 'lali_robo', name: 'Robo Lali', imageSrc: 'assets/tiles/lali_robo.png', price: 600, imageObj: new Image(), isReady: false, unlocked: false },
        { id: 'lali_golden', name: 'Golden Lali', imageSrc: 'assets/tiles/lali_golden.png', price: 1000, imageObj: new Image(), isReady: false, unlocked: false },
        { id: 'lali_kawaii', name: 'Kawaii Lali', imageSrc: 'assets/tiles/kawaii_lali.png', price: 1600, imageObj: new Image(), isReady: false, unlocked: false },
        { id: 'lali_champion', name: '#1 Lali', imageSrc: 'assets/tiles/lali_champion.png', price: 99999, imageObj: new Image(), isReady: false, unlocked: false, isChampionSkin: true } 
    ];
    let currentSelectedCharacterId = 'lali_classic';
    let shopPreviewCharacterId = 'lali_classic';

    // --- ASSET LOADING ---
    const beakerObstacleImg = new Image(); beakerObstacleImg.src = 'assets/tiles/beaker-removebg-preview.png'; beakerObstacleImg.isReady = false;
    const rulerObstacleImg = new Image(); rulerObstacleImg.src = 'assets/tiles/ruler_obstacle.png'; rulerObstacleImg.isReady = false;
    const bookstackObstacleImg = new Image(); bookstackObstacleImg.src = 'assets/tiles/bookstack_obstacle.png'; bookstackObstacleImg.isReady = false;
    const fuelPowerUpImg = new Image(); fuelPowerUpImg.src = 'assets/tiles/beans-removebg-preview.png'; fuelPowerUpImg.isReady = false;
    const shieldPowerUpImg = new Image(); shieldPowerUpImg.src = 'assets/tiles/your_shield_image.png'; shieldPowerUpImg.isReady = false;
    const backgroundMusic = new Audio(); backgroundMusic.isReady = false;
    const gameOverSound = new Audio(); gameOverSound.isReady = false; 
    const backgroundImg = new Image(); backgroundImg.src = 'assets/tiles/background_sky.png'; backgroundImg.isReady = false;
    let backgroundX = 0;
    const BACKGROUND_SCROLL_SPEED_FACTOR = 0.3;

    let assetsToLoad = charactersData.length + 3 + 1 + 1 + 1 + 1 + 1; 
    let assetsLoaded = 0;

    // --- GAMEPLAY CONSTANTS ---
    const ROCKET_WIDTH = 90; const ROCKET_HEIGHT = 130; const GRAVITY = 0.28; const FLAP_STRENGTH = -7.5;
    const MAX_FUEL = 100; const FUEL_CONSUMPTION = 2.5; const FUEL_REGEN_RATE = 0;
    const OBSTACLE_GAP = 260 + (ROCKET_HEIGHT - 95); const OBSTACLE_SPACING = 420;
    const MIN_OBSTACLE_SEGMENT_HEIGHT = 40;
    const OBSTACLE_VERTICAL_MOVEMENT_MAX_OFFSET = 60; const OBSTACLE_VERTICAL_SPEED = 0.45;
    const OBSTACLE_TYPES = {
        beaker:    { img: beakerObstacleImg,    visualWidth: 120, effectiveWidth: 20,  hitboxInsetX: 15, hitboxInsetYGapEdge: 30 },
        ruler:     { img: rulerObstacleImg,     visualWidth: 60,  effectiveWidth: 15,  hitboxInsetX: 5,  hitboxInsetYGapEdge: 20  },
        bookstack: { img: bookstackObstacleImg, visualWidth: 150, effectiveWidth: 120, hitboxInsetX: 25, hitboxInsetYGapEdge: 100 }
    };
    const SHIELD_POWERUP_SIZE = 70; const FUEL_POWERUP_SIZE = 100;
    
    let powerUpSpawnChance = 0.011; 

    const SHIELD_DURATION = 540;
    const LOW_FUEL_THRESHOLD_PERCENT = 35; let canSpawnEmergencyBeans = true;
    const EMERGENCY_BEANS_COOLDOWN_FRAMES = 180; let emergencyBeansCooldownTimer = 0;
    const OBSTACLE_SPEED_INITIAL = 2.0; const SPEED_INCREMENT = 0.05;
    const SPEED_INCREMENT_OBSTACLE_COUNT = 10; const MAX_SPEED_OBSTACLE_THRESHOLD = 100;
    const MAX_SPEED_MULTIPLIER = 1.5; const MAX_GAME_SPEED = OBSTACLE_SPEED_INITIAL * MAX_SPEED_MULTIPLIER;
    const INITIAL_OBSTACLE_X_POSITION_FACTOR = 0.65;

    let currentlyPlayingFuelEmptySound = null; 
    const sounds = { 
        flap: new Audio('assets/sounds/fart.wav'), 
        score: new Audio('assets/sounds/score.wav'),
        hit: new Audio('assets/sounds/hit.wav'),    
        powerup: new Audio('assets/sounds/powerup.wav'),
        fuelEmpty: new Audio('assets/sounds/fuel_empty.wav'),
        purchase: new Audio('assets/sounds/purchase.wav')
    };

    function getCharacterById(id) { return charactersData.find(char => char.id === id) || charactersData[0]; }
    function getCurrentGameCharacter() { return getCharacterById(currentSelectedCharacterId); }

    function assetLoadManager(assetName = "Generic asset") {
        assetsLoaded++;
        console.log(`${assetName} loaded. Assets: ${assetsLoaded}/${assetsToLoad} (Initial load flag: ${initialAssetsHaveLoaded})`);
        if (assetsLoaded >= assetsToLoad && !initialAssetsHaveLoaded) {
            initialAssetsHaveLoaded = true; 
            console.log("All critical assets successfully loaded for the first time. Initializing game.");
            gameState = 'START'; 
            initGame();
        } else if (assetsLoaded >= assetsToLoad && initialAssetsHaveLoaded) {
            console.log("Asset loaded/retried after initial setup. Game should already be initialized.");
        }
    }

    charactersData.forEach(charData => {
        charData.imageObj.src = charData.imageSrc;
        charData.imageObj.onload = () => { charData.isReady = true; assetLoadManager(`Char ${charData.name}`); };
        charData.imageObj.onerror = () => { charData.isReady = false; console.error(`Failed to load character image: ${charData.name} at ${charData.imageSrc}`); assetLoadManager(`Char ${charData.name} (fail)`); };
    });

    beakerObstacleImg.onload = () => { beakerObstacleImg.isReady = true; assetLoadManager("Beaker Obstacle"); };
    beakerObstacleImg.onerror = () => { beakerObstacleImg.isReady = false; console.error("Beaker Obstacle fail"); assetLoadManager("Beaker (fail)"); };
    rulerObstacleImg.onload = () => { rulerObstacleImg.isReady = true; assetLoadManager("Ruler Obstacle"); };
    rulerObstacleImg.onerror = () => { rulerObstacleImg.isReady = false; console.error("Ruler Obstacle fail"); assetLoadManager("Ruler (fail)"); };
    bookstackObstacleImg.onload = () => { bookstackObstacleImg.isReady = true; assetLoadManager("Bookstack Obstacle"); };
    bookstackObstacleImg.onerror = () => { bookstackObstacleImg.isReady = false; console.error("Bookstack Obstacle fail"); assetLoadManager("Bookstack (fail)"); };
    fuelPowerUpImg.onload = () => { fuelPowerUpImg.isReady = true; assetLoadManager("Fuel Image"); };
    fuelPowerUpImg.onerror = () => { fuelPowerUpImg.isReady = false; console.error("Fuel Image fail"); assetLoadManager("Fuel (fail)"); };
    shieldPowerUpImg.onload = () => { shieldPowerUpImg.isReady = true; assetLoadManager("Shield Image"); };
    shieldPowerUpImg.onerror = () => { shieldPowerUpImg.isReady = false; console.error("Shield Image fail"); assetLoadManager("Shield (fail)"); };
    
    backgroundMusic.src = 'assets/sounds/background_music.mp3'; backgroundMusic.loop = true;
    backgroundMusic.oncanplaythrough = () => { backgroundMusic.isReady = true; assetLoadManager("Background Music"); applyVolumeSettings(); };
    backgroundMusic.onerror = () => { backgroundMusic.isReady = false; console.error("BG Music fail"); assetLoadManager("Music (fail)"); };
    try { backgroundMusic.load(); } catch (e) { console.error("Music load() call fail:", e); }

    gameOverSound.src = 'assets/sounds/game_over.wav'; 
    gameOverSound.oncanplaythrough = () => { gameOverSound.isReady = true; assetLoadManager("Game Over Sound"); applyVolumeSettings(); };
    gameOverSound.onerror = () => { gameOverSound.isReady = false; console.error("Game Over Sound fail"); assetLoadManager("Game Over Sound (fail)"); };
    try { gameOverSound.load(); } catch (e) { console.error("Game Over Sound load() call fail:", e); }

    backgroundImg.onload = () => { backgroundImg.isReady = true; assetLoadManager("Background Image"); };
    backgroundImg.onerror = () => { backgroundImg.isReady = false; console.error("Background Image fail"); assetLoadManager("Background Image (fail)"); };

    Object.values(sounds).forEach(sound => { 
        if (sound && sound.src) { 
            sound.load(); 
            sound.oncanplaythrough = () => { console.log(`${sound.src.split('/').pop()} SFX ready`); applyVolumeSettings();};
            sound.onerror = (e) => console.error(`SFX Error: ${sound.src}`, e); 
        }
    });

    // --- VOLUME AND SETTINGS FUNCTIONS ---
    function applyVolumeSettings() {
        if (backgroundMusic.isReady) {
            backgroundMusic.volume = masterVolume * musicVolume;
        }
        if (gameOverSound.isReady) {
            gameOverSound.volume = masterVolume * sfxVolume;
        }
        Object.values(sounds).forEach(sound => {
            if (sound && sound.src) { 
                 sound.volume = masterVolume * sfxVolume;
            }
        });
    }

    function loadSettings() {
        masterVolume = parseFloat(localStorage.getItem('flappyLali_masterVolume')) || 1.0;
        musicVolume = parseFloat(localStorage.getItem('flappyLali_musicVolume')) || 0.3;
        sfxVolume = parseFloat(localStorage.getItem('flappyLali_sfxVolume')) || 1.0;
        localPlayerDisplayName = localStorage.getItem('flappyLali_displayName') || 'Player';
        localPlayerId = localStorage.getItem('flappyLali_playerId');

        const savedSpawnChance = localStorage.getItem('flappyLali_powerUpSpawnChance');
        if (savedSpawnChance !== null) {
            powerUpSpawnChance = parseFloat(savedSpawnChance);
        }


        if (!localPlayerId) {
            localPlayerId = generateUID();
            localStorage.setItem('flappyLali_playerId', localPlayerId);
        }
        
        if (displayNameInput) displayNameInput.value = localPlayerDisplayName;
        if (masterVolumeSlider) masterVolumeSlider.value = masterVolume;
        if (musicVolumeSlider) musicVolumeSlider.value = musicVolume;
        if (sfxVolumeSlider) sfxVolumeSlider.value = sfxVolume;
        
        applyVolumeSettings();
        promptForDisplayNameIfNeeded();
    }

    function saveSettings() {
        localStorage.setItem('flappyLali_masterVolume', masterVolume);
        localStorage.setItem('flappyLali_musicVolume', musicVolume);
        localStorage.setItem('flappyLali_sfxVolume', sfxVolume);
        localStorage.setItem('flappyLali_displayName', localPlayerDisplayName); 
        
        localStorage.setItem('flappyLali_powerUpSpawnChance', powerUpSpawnChance);
        
        applyVolumeSettings(); 
    }

    function generateUID() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    function promptForDisplayNameIfNeeded() {
        if (localStorage.getItem('flappyLali_displayNamePrompted') === 'true') return;

        setTimeout(() => { 
            const name = prompt("Welcome to Flappy Lali Fart!\nPlease enter your display name for the leaderboard:", localPlayerDisplayName);
            if (name && name.trim() !== "") {
                localPlayerDisplayName = name.trim().substring(0, 20); 
                if(displayNameInput) displayNameInput.value = localPlayerDisplayName;
                savePlayerDisplayName(); 
            }
            localStorage.setItem('flappyLali_displayNamePrompted', 'true');
        }, 500);
    }
    
    function savePlayerDisplayName() {
        if (!displayNameInput) return;
        const newName = displayNameInput.value.trim().substring(0, 20);
        if (newName) {
            localPlayerDisplayName = newName;
            localStorage.setItem('flappyLali_displayName', localPlayerDisplayName);
            if (displayNameStatus) {
                displayNameStatus.textContent = "Display name saved!";
                displayNameStatus.className = 'success';
                setTimeout(() => { displayNameStatus.textContent = ""; }, 2000);
            }
        } else {
             if (displayNameStatus) {
                displayNameStatus.textContent = "Name cannot be empty.";
                displayNameStatus.className = 'error';
             }
        }
    }

    // --- FIREBASE LEADERBOARD FUNCTIONS ---
    async function submitScoreToFirebase(userId, name, newScore) {
        if (!db) {
            console.warn("Firestore not initialized. Cannot submit score.");
            return false; 
        }
        if (!userId || !name || typeof newScore !== 'number') {
            console.warn("Invalid data for score submission.");
            return false;
        }

        const leaderboardRef = db.collection("leaderboard");
        const userScoreRef = leaderboardRef.doc(userId);

        try {
            const userDoc = await userScoreRef.get();
            let isWorldRecordHolder = false;
            if (userDoc.exists) {
                const currentOnlineScore = userDoc.data().score || 0;
                if (newScore > currentOnlineScore) {
                    await userScoreRef.set({
                        displayName: name,
                        score: newScore,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp() 
                    });
                    console.log("Score updated on Firebase.");
                } else {
                    console.log("New score not higher than Firebase score. Not updating.");
                    return false; 
                }
            } else {
                await userScoreRef.set({
                    displayName: name,
                    score: newScore,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp() 
                });
                console.log("New score submitted to Firebase.");
            }
            
            const topScoreQuery = leaderboardRef.orderBy("score", "desc").limit(1);
            const topScoreSnapshot = await topScoreQuery.get();
            if (!topScoreSnapshot.empty) {
                const worldTopScore = topScoreSnapshot.docs[0].data().score;
                if (newScore >= worldTopScore && topScoreSnapshot.docs[0].id === userId) { 
                    isWorldRecordHolder = true; 
                }
            } else { 
                 isWorldRecordHolder = true;
            }
            return isWorldRecordHolder; 
        } catch (error) {
            console.error("Error submitting score to Firebase:", error);
            return false;
        }
    }

    async function fetchLeaderboard() {
        if (!db) {
            if(leaderboardLoadingMsg) leaderboardLoadingMsg.textContent = "Leaderboard disabled (Firebase not connected).";
            return;
        }
        if(leaderboardLoadingMsg) leaderboardLoadingMsg.textContent = "Loading leaderboard...";
        if(leaderboardListContainer) leaderboardListContainer.innerHTML = ''; 

        try {
            const snapshot = await db.collection("leaderboard").orderBy("score", "desc").limit(50).get(); 
            if (snapshot.empty) {
                if(leaderboardLoadingMsg) leaderboardLoadingMsg.textContent = "Leaderboard is empty!";
                return;
            }
            
            if(leaderboardLoadingMsg) leaderboardLoadingMsg.style.display = 'none';
            let rank = 1;
            let userFoundOnBoard = false;
            snapshot.forEach(doc => {
                const data = doc.data();
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('leaderboard-entry');
                if (doc.id === localPlayerId) {
                    entryDiv.classList.add('user-highlight');
                    entryDiv.id = 'userLeaderboardEntry'; 
                    if(userNameDisplay) userNameDisplay.textContent = data.displayName;
                    if(userScoreDisplay) userScoreDisplay.textContent = data.score;
                    if(userRankDisplay) userRankDisplay.textContent = rank;
                    if(scrollToUserButton) scrollToUserButton.style.display = 'inline-block';
                    userFoundOnBoard = true;
                }
                entryDiv.innerHTML = `
                    <span class="leaderboard-rank">${rank}.</span>
                    <span class="leaderboard-name">${data.displayName || 'Unnamed Player'}</span>
                    <span class="leaderboard-score">${data.score}</span>
                `;
                if(leaderboardListContainer) leaderboardListContainer.appendChild(entryDiv);
                rank++;
            });

            if (!userFoundOnBoard) { 
                 fetchUserSpecificRank();
            }

        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            if(leaderboardLoadingMsg) leaderboardLoadingMsg.textContent = "Error loading leaderboard.";
        }
    }
    
    async function fetchUserSpecificRank() {
        if (!db || !localPlayerId) return;
        try {
            const userDoc = await db.collection("leaderboard").doc(localPlayerId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if(userNameDisplay) userNameDisplay.textContent = userData.displayName || localPlayerDisplayName;
                if(userScoreDisplay) userScoreDisplay.textContent = userData.score;
                
                const higherScoresSnapshot = await db.collection("leaderboard")
                                                .where("score", ">", userData.score)
                                                .get();
                const rank = higherScoresSnapshot.size + 1;
                if(userRankDisplay) userRankDisplay.textContent = rank;
                 if(scrollToUserButton) scrollToUserButton.style.display = 'none'; 
            } else {
                if(userNameDisplay) userNameDisplay.textContent = localPlayerDisplayName;
                if(userScoreDisplay) userScoreDisplay.textContent = 'N/A';
                if(userRankDisplay) userRankDisplay.textContent = 'N/A';
                if(scrollToUserButton) scrollToUserButton.style.display = 'none';
            }
        } catch (error) {
            console.error("Error fetching user specific rank:", error);
        }
    }
    // ... (previous code, ending with fetchUserSpecificRank)

    // --- GAME CLASSES ---
    class Rocket {
        constructor() { this.x = GAME_WIDTH / 6; this.y = GAME_HEIGHT / 2 - ROCKET_HEIGHT / 2; this.width = ROCKET_WIDTH; this.height = ROCKET_HEIGHT; this.velocityY = 0; this.fuel = MAX_FUEL; this.shieldActive = false; this.shieldTimer = 0; this.character = getCurrentGameCharacter(); }
        flap() { 
            if (this.fuel > 0 && gameState === 'PLAYING') { 
                if (currentlyPlayingFuelEmptySound && !currentlyPlayingFuelEmptySound.paused) {
                    currentlyPlayingFuelEmptySound.pause();
                    currentlyPlayingFuelEmptySound.currentTime = 0;
                    currentlyPlayingFuelEmptySound = null;
                }
                this.velocityY = FLAP_STRENGTH; this.fuel -= FUEL_CONSUMPTION; if (this.fuel < 0) this.fuel = 0; playSound(sounds.flap); for (let i = 0; i < 8; i++) { particles.push(new Particle(this.x + this.width / 2, this.y + this.height * 0.9, 'thrust'));}
            } else if (gameState === 'PLAYING') { 
                playSound(sounds.fuelEmpty); 
            }
        }
        update() { this.velocityY += GRAVITY; this.y += this.velocityY; if (this.fuel < MAX_FUEL) { this.fuel += FUEL_REGEN_RATE; if (this.fuel > MAX_FUEL) this.fuel = MAX_FUEL; } if (this.shieldActive) { this.shieldTimer--; if (this.shieldTimer <= 0) this.shieldActive = false; } if (this.y < 0) { this.y = 0; this.velocityY = 0; }}
        draw() {
            const charImg = this.character.imageObj;
            if (this.character.isReady && charImg.complete && charImg.naturalWidth !== 0 && charImg.naturalHeight !== 0) {
                const boxW = this.width; const boxH = this.height;
                const imgW = charImg.naturalWidth; const imgH = charImg.naturalHeight;
                const boxAspectRatio = boxW / boxH; const imgAspectRatio = imgW / imgH;
                let drawWidth, drawHeight;
                if (imgAspectRatio > boxAspectRatio) { drawWidth = boxW; drawHeight = drawWidth / imgAspectRatio; } 
                else { drawHeight = boxH; drawWidth = drawHeight * imgAspectRatio; }
                const drawX = this.x + (boxW - drawWidth) / 2; const drawY = this.y + (boxH - drawHeight) / 2;
                ctx.drawImage(charImg, drawX, drawY, drawWidth, drawHeight);
            } else { ctx.fillStyle = 'purple'; ctx.fillRect(this.x, this.y, this.width, this.height); }
            if (this.shieldActive) { ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; ctx.lineWidth = 5; ctx.beginPath(); const r = Math.max(this.width, this.height) * 0.8; ctx.arc(this.x + this.width / 2, this.y + this.height / 2, r, 0, Math.PI * 2); ctx.stroke(); }
        }
    }
    class Obstacle { 
        constructor(x, initialGapY, movesVertically, type) { this.x = x; this.type = type; const P = OBSTACLE_TYPES[this.type]; this.image = P.img; this.visualWidth = P.visualWidth; this.effectiveWidth = P.effectiveWidth; this.hitboxInsetX = P.hitboxInsetX; this.hitboxInsetYGapEdge = P.hitboxInsetYGapEdge; this.initialGapY = initialGapY; this.currentGapY = initialGapY; this.movesVertically = movesVertically; this.verticalDirection = Math.random() > 0.5 ? 1 : -1; this.passed = false; this.topPart = { y: 0, height: 0 }; this.bottomPart = { y: 0, height: 0 }; this._calculateDimensions(); }
        _calculateDimensions() { this.topPart.y = 0; this.topPart.height = this.currentGapY - OBSTACLE_GAP / 2; if (this.topPart.height < MIN_OBSTACLE_SEGMENT_HEIGHT) this.topPart.height = MIN_OBSTACLE_SEGMENT_HEIGHT; this.bottomPart.y = this.currentGapY + OBSTACLE_GAP / 2; this.bottomPart.height = GAME_HEIGHT - this.bottomPart.y; if (this.bottomPart.height < MIN_OBSTACLE_SEGMENT_HEIGHT) this.bottomPart.height = MIN_OBSTACLE_SEGMENT_HEIGHT; if (this.topPart.y + this.topPart.height > this.bottomPart.y - MIN_OBSTACLE_SEGMENT_HEIGHT) { this.topPart.height = Math.max(MIN_OBSTACLE_SEGMENT_HEIGHT, this.currentGapY - OBSTACLE_GAP / 2); this.bottomPart.y = this.currentGapY + OBSTACLE_GAP / 2; this.bottomPart.height = Math.max(MIN_OBSTACLE_SEGMENT_HEIGHT, GAME_HEIGHT - this.bottomPart.y); }}
        update() { this.x -= gameSpeed; if (this.movesVertically) { const mA = OBSTACLE_VERTICAL_SPEED * this.verticalDirection; let nGC = this.currentGapY + mA; const mB = this.initialGapY - OBSTACLE_VERTICAL_MOVEMENT_MAX_OFFSET; const xB = this.initialGapY + OBSTACLE_VERTICAL_MOVEMENT_MAX_OFFSET; const sM = OBSTACLE_GAP / 2 + MIN_OBSTACLE_SEGMENT_HEIGHT + 10; const sX = GAME_HEIGHT - (OBSTACLE_GAP / 2 + MIN_OBSTACLE_SEGMENT_HEIGHT + 10); const fM = Math.max(mB, sM); const fX = Math.min(xB, sX); if (nGC > fX || nGC < fM) { this.verticalDirection *= -1; nGC = Math.max(fM, Math.min(fX, nGC)); } this.currentGapY = nGC; } this._calculateDimensions(); }
        draw() { if (!this.image || !this.image.isReady) return; const dX = this.x - (this.visualWidth - this.effectiveWidth) / 2; if (this.topPart.height > 0) { ctx.save(); ctx.translate(dX, this.topPart.y + this.topPart.height); ctx.scale(1, -1); ctx.drawImage(this.image, 0, 0, this.visualWidth, this.topPart.height); ctx.restore(); } if (this.bottomPart.height > 0) { ctx.drawImage(this.image, dX, this.bottomPart.y, this.visualWidth, this.bottomPart.height); } }
    }
    class PowerUp { 
        constructor(x, y, type) { this.x = x; this.y = y; this.type = type; if (this.type === 'shield') { this.size = SHIELD_POWERUP_SIZE; } else if (this.type === 'fuel') { this.size = FUEL_POWERUP_SIZE; } else { this.size = 100; } this.collected = false; }
        update() { this.x -= gameSpeed; }
        draw() {
            if (this.collected) return;
            if (this.type === 'shield') {
                if (shieldPowerUpImg.isReady && shieldPowerUpImg.complete && shieldPowerUpImg.naturalWidth > 0) { ctx.drawImage(shieldPowerUpImg, this.x, this.y, this.size, this.size); } 
                else { const cX = this.x + this.size / 2; const cY = this.y + this.size / 2; ctx.beginPath(); ctx.arc(cX, cY, this.size / 2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0, 180, 200, 0.7)'; ctx.fill(); ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font = `bold ${this.size*0.6}px Arial`; ctx.fillText('S?', cX, cY); }
            } else if (this.type === 'fuel') {
                if (fuelPowerUpImg.isReady && fuelPowerUpImg.complete && fuelPowerUpImg.naturalWidth > 0) { ctx.drawImage(fuelPowerUpImg, this.x, this.y, this.size, this.size); } 
                else { const cX = this.x + this.size / 2; const cY = this.y + this.size / 2; ctx.beginPath(); ctx.arc(cX, cY, this.size / 2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,190,0,0.7)'; ctx.fill(); ctx.fillStyle = 'black'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font = `bold ${this.size*0.6}px Arial`; ctx.fillText('F?', cX, cY); }
            }
        }
        applyEffect(r) { 
            playSound(sounds.powerup); 
            if (this.type === 'shield') { r.shieldActive = true; r.shieldTimer = SHIELD_DURATION; } 
            else if (this.type === 'fuel') { 
                r.fuel = MAX_FUEL; 
                if (currentlyPlayingFuelEmptySound && !currentlyPlayingFuelEmptySound.paused) {
                    currentlyPlayingFuelEmptySound.pause();
                    currentlyPlayingFuelEmptySound.currentTime = 0;
                    currentlyPlayingFuelEmptySound = null;
                }
            } 
            this.collected = true; for (let i=0; i<20; i++) { particles.push(new Particle(this.x+this.size/2, this.y+this.size/2, 'collect'));}
        }
    }
    class Particle { 
        constructor(x, y, type) { this.x=x; this.y=y; this.type=type; this.size=Math.random()*(type==='explosion'?10:(type==='thrust'?8:7))+3; this.initialLife=(type==='explosion'?70:(type==='thrust'?30:40))+Math.random()*30; this.life=this.initialLife; const a=Math.random()*Math.PI*2; let s=Math.random()*(type==='explosion'?10:(type==='collect'?5:3))+1; if(type==='thrust'){const r=Math.floor(Math.random()*50)+100;const g=Math.floor(Math.random()*40)+60;const b=Math.floor(Math.random()*30)+20;this.color=`rgba(${r},${g},${b},${Math.random()*0.4+0.4})`;this.velocityX=(Math.random()-0.5)*2.5;this.velocityY=Math.random()*2.0+1.0;this.size=Math.random()*8+4;}else{this.velocityX=Math.cos(a)*s;this.velocityY=Math.sin(a)*s;if(type==='explosion'){this.color=`rgba(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*120)},0,0.8)`;}else{this.color=`rgba(255,230,${Math.random()>0.5?50:150},0.8)`;}}}
        update(){this.x+=this.velocityX;this.y+=this.velocityY;if(this.type==='thrust'){this.velocityY+=0.03;this.velocityX*=0.98;this.size*=0.99;}else if(this.type==='explosion'||this.type==='collect'){this.velocityX*=0.97;this.velocityY*=0.97;if(this.type==='explosion')this.velocityY+=0.1;}this.life--;if(this.size<1)this.life=0;}
        draw(){if(this.life<=0||this.size<=0)return;ctx.globalAlpha=Math.max(0,this.life/this.initialLife);ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,Math.max(0,this.size),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1.0;}
    }

    // --- SOUND FUNCTIONS ---
    function playSound(sound) {
        if (sound && sound.src) {
            if (sound !== sounds.fuelEmpty && currentlyPlayingFuelEmptySound && !currentlyPlayingFuelEmptySound.paused) {
                currentlyPlayingFuelEmptySound.pause();
                currentlyPlayingFuelEmptySound.currentTime = 0; 
                currentlyPlayingFuelEmptySound = null; 
            }
    
            if (sound.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
                if (sound === sounds.fuelEmpty) {
                    if (currentlyPlayingFuelEmptySound && !currentlyPlayingFuelEmptySound.paused) {
                        return; 
                    }
                    currentlyPlayingFuelEmptySound = sound; 
                }
    
                sound.currentTime = 0;
                sound.play().catch(e => console.warn(`Sound play failed for ${sound.src.split('/').pop()}:`, e));
            } else {
                console.warn(`Sound ${sound.src.split('/').pop()} not ready. State: ${sound.readyState}, NetworkState: ${sound.networkState}`);
                if (sound.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || sound.networkState === HTMLMediaElement.NETWORK_EMPTY) {
                    console.log(`Attempting to reload sound: ${sound.src.split('/').pop()}`);
                    sound.load();
                }
            }
        } else {
            console.warn("playSound called with an invalid or undefined sound object.");
        }
    }
    
    function playGameOverSound() {
        if (gameOverSound.isReady) {
            playSound(gameOverSound);
        } else {
            console.warn("Game over sound not ready to play.");
        }
    }

    // --- UI AND SCREEN MANAGEMENT ---
    function showScreen(screenElement) {
        [startScreen, shopScreen, gameOverScreen, settingsScreen, leaderboardScreen, newWorldHighScorePopup].forEach(s => {
            if (s) s.style.display = 'none';
        });
        if (screenElement) screenElement.style.display = 'flex'; 
    }
    
    let startScreenAnimFrame = 0; const startScreenCharYOffsetMax = 25; const startScreenCharBobSpeed = 0.03; let isStartScreenLoopRunning = false;
    function drawStartScreenCharacter(bobOffset) { 
        const gC = getCurrentGameCharacter();
        if (!gC || !gC.isReady || !ctx) return;
        const charImg = gC.imageObj;
        const scaleFactor = 2.8; const boxW_target = ROCKET_WIDTH * scaleFactor; const boxH_target = ROCKET_HEIGHT * scaleFactor;
        const boxX_corner = GAME_WIDTH * 0.80 - boxW_target / 2; const boxY_corner = GAME_HEIGHT / 2 - boxH_target / 2 + bobOffset;
        if (charImg.complete && charImg.naturalWidth !== 0 && charImg.naturalHeight !== 0) {
            const imgW = charImg.naturalWidth; const imgH = charImg.naturalHeight;
            const boxAspectRatio = boxW_target / boxH_target; const imgAspectRatio = imgW / imgH;
            let drawWidth, drawHeight;
            if (imgAspectRatio > boxAspectRatio) { drawWidth = boxW_target; drawHeight = drawWidth / imgAspectRatio; } 
            else { drawHeight = boxH_target; drawWidth = drawHeight * imgAspectRatio; }
            const drawX = boxX_corner + (boxW_target - drawWidth) / 2; const drawY = boxY_corner + (boxH_target - drawHeight) / 2;
            ctx.drawImage(charImg, drawX, drawY, drawWidth, drawHeight);
        } else { ctx.fillStyle = 'grey'; ctx.fillRect(boxX_corner, boxY_corner, boxW_target, boxH_target); }
    }
    function startScreenAnimationLoop() { if (gameState !== 'START' || !isStartScreenLoopRunning || (startScreen && startScreen.style.display === 'none') ) { isStartScreenLoopRunning = false; return; } if(ctx){ctx.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT); drawBackground();} startScreenAnimFrame++; const bO = Math.sin(startScreenAnimFrame*startScreenCharBobSpeed)*startScreenCharYOffsetMax; drawStartScreenCharacter(bO); requestAnimationFrame(startScreenAnimationLoop); }

    // --- DATA PERSISTENCE ---
    function loadGameData() { 
        loadSettings(); 
        coins = parseInt(localStorage.getItem('flappyLaliCoins_v2'))||0; 
        highScore = parseInt(localStorage.getItem('flappyLaliFartV2_hs'))||0; 
        currentSelectedCharacterId = localStorage.getItem('flappyLaliSelectedChar_v2')||'lali_classic'; 
        shopPreviewCharacterId = currentSelectedCharacterId; 
        const uC = JSON.parse(localStorage.getItem('flappyLaliUnlockedChars_v2')); 
        if (uC && Array.isArray(uC)) { charactersData.forEach(c => { if (uC.includes(c.id)) c.unlocked = true; }); } 
        const cC = getCharacterById('lali_classic'); if (cC) cC.unlocked = true; 
        const sel = getCharacterById(currentSelectedCharacterId); 
        if (!sel||!sel.unlocked) { currentSelectedCharacterId = 'lali_classic'; shopPreviewCharacterId = 'lali_classic'; localStorage.setItem('flappyLaliSelectedChar_v2', currentSelectedCharacterId); } 
        updateCoinDisplay(); 
        updateUI(null); 
    }
    function saveCoins() { localStorage.setItem('flappyLaliCoins_v2', coins); } 
    function saveHighScore() { localStorage.setItem('flappyLaliFartV2_hs', highScore); }
    function saveCharacterData() { const uCI = charactersData.filter(c => c.unlocked).map(c => c.id); localStorage.setItem('flappyLaliUnlockedChars_v2', JSON.stringify(uCI)); localStorage.setItem('flappyLaliSelectedChar_v2', currentSelectedCharacterId); }
    function updateCoinDisplay() { if(coinCountDisplay)coinCountDisplay.textContent=coins; if(shopCoinCountDisplay)shopCoinCountDisplay.textContent=coins; }
    
    // --- SHOP FUNCTIONS ---
    function renderCharacterShop() { if(!shopPanelLeft){console.error("Shop panel left not found!"); return;} shopPanelLeft.innerHTML=''; charactersData.forEach(c=>{ if (c.isChampionSkin && !c.unlocked) return; const s=document.createElement('div'); s.classList.add('character-slot'); if(c.id===shopPreviewCharacterId)s.classList.add('selected-in-shop'); const i=new Image();i.src=c.imageSrc;i.alt=c.name;if(!c.isReady||!c.imageObj.complete||c.imageObj.naturalWidth===0)i.classList.add('not-ready');s.appendChild(i); const iD=document.createElement('div');iD.classList.add('char-info-shop'); const nP=document.createElement('p');nP.classList.add('char-name');nP.textContent=c.name;iD.appendChild(nP); if(c.unlocked){const sP=document.createElement('p');sP.classList.add('char-status');sP.textContent=(c.id===currentSelectedCharacterId)?"Equipped":"Owned";iD.appendChild(sP);}else{const pP=document.createElement('p');pP.classList.add('char-price');pP.textContent=`Price: ${c.price}`;iD.appendChild(pP);} s.appendChild(iD); const bC=document.createElement('div');bC.classList.add('shop-button-container'); if(c.unlocked){if(c.id!==currentSelectedCharacterId){const eB=document.createElement('button');eB.textContent="Equip";eB.onclick=(e)=>{e.stopPropagation();equipCharacter(c.id);};bC.appendChild(eB);}}else if (!c.isChampionSkin) {const bB=document.createElement('button');bB.textContent="Buy";if(coins<c.price)bB.disabled=true;bB.onclick=(e)=>{e.stopPropagation();buyCharacter(c.id);};bC.appendChild(bB);} s.appendChild(bC);s.onclick=()=>updateShopPreview(c.id);shopPanelLeft.appendChild(s);});}
    function updateShopPreview(cId) { shopPreviewCharacterId=cId; const c=getCharacterById(cId); if(!c)return; if(shopCharacterPreviewImage){if(c.isReady&&c.imageObj.complete&&c.imageObj.naturalWidth>0){shopCharacterPreviewImage.src=c.imageObj.src;shopCharacterPreviewImage.classList.remove('not-ready');}else{shopCharacterPreviewImage.src='';shopCharacterPreviewImage.classList.add('not-ready');}} if(shopCharacterName)shopCharacterName.textContent=c.name; if(shopCharacterPriceStatus){if(c.unlocked){shopCharacterPriceStatus.textContent=(c.id===currentSelectedCharacterId)?"Currently Equipped":"Owned";shopCharacterPriceStatus.className='char-status owned';} else if (c.isChampionSkin) {shopCharacterPriceStatus.textContent="Unlock by being #1!"; shopCharacterPriceStatus.className='char-status';} else{shopCharacterPriceStatus.textContent=`Price: ${c.price} Coins`;shopCharacterPriceStatus.className='char-status';}} if(shopPanelLeft){const slts=shopPanelLeft.querySelectorAll('.character-slot');slts.forEach(slt=>{const sCN=slt.querySelector('.char-name').textContent;const sC=charactersData.find(ch=>ch.name===sCN);if(sC&&sC.id===cId)slt.classList.add('selected-in-shop');else slt.classList.remove('selected-in-shop');});}}
    function equipCharacter(cId) { const cTE=getCharacterById(cId); if(cTE&&cTE.unlocked){currentSelectedCharacterId=cId;saveCharacterData(); if(shopScreen.style.display === 'flex') {renderCharacterShop(); updateShopPreview(shopPreviewCharacterId); } rocket = new Rocket(); }}
    function buyCharacter(cId) { const cTB=getCharacterById(cId); if(cTB&&!cTB.unlocked&&!cTB.isChampionSkin&&coins>=cTB.price){coins-=cTB.price;cTB.unlocked=true;playSound(sounds.purchase);saveCoins();saveCharacterData();updateCoinDisplay();renderCharacterShop();updateShopPreview(cId);}}
    
    // --- REDEEM CODE ---
    const redeemCodes = { "imjaron": { description: "All Lali characters unlocked!", action: () => { let uS = false; charactersData.forEach(c => { if (!c.unlocked && !c.isChampionSkin) { c.unlocked = true; uS = true; }}); if (uS) { saveCharacterData(); if (shopScreen.style.display === 'flex') { renderCharacterShop(); updateShopPreview(shopPreviewCharacterId); }} return uS; }}};
    function handleRedeemCode() { if(!redeemCodeInput||!redeemStatusMessage)return; const eC=redeemCodeInput.value.trim().toLowerCase(); redeemCodeInput.value=''; if(redeemCodes[eC]){const cE=redeemCodes[eC];const succ=cE.action();if(succ){playSound(sounds.purchase);redeemStatusMessage.textContent=cE.description||"Code redeemed!";redeemStatusMessage.className='success';}else{redeemStatusMessage.textContent="Code applied, no new changes.";redeemStatusMessage.className='success';}}else{redeemStatusMessage.textContent="Invalid code.";redeemStatusMessage.className='error';} redeemStatusMessage.style.display='block'; setTimeout(()=>{if(redeemStatusMessage)redeemStatusMessage.style.display='none';},4000);}

    // --- GAME STATE FUNCTIONS ---
    function initGame() {
        if (gameState !== 'LOADING' && !initialAssetsHaveLoaded) { loadGameData(); }
        rocket = null; obstacles = []; powerUps = []; particles = [];
        score = 0; frame = 0; gameSpeed = OBSTACLE_SPEED_INITIAL;
        canSpawnEmergencyBeans = true; emergencyBeansCooldownTimer = 0; 
        
        showScreen(startScreen); 
        
        const allAssetsReady = assetsLoaded >= assetsToLoad;
        if(startButton)startButton.disabled = !allAssetsReady;
        if(shopButton)shopButton.disabled = !allAssetsReady;
        if(settingsButton)settingsButton.disabled = !allAssetsReady;
        if(leaderboardButton)leaderboardButton.disabled = !allAssetsReady;
        if(redeemCodeButton)redeemCodeButton.disabled = !allAssetsReady;
        
        updateUI(null);
        if(ctx)ctx.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT);
        isStartScreenLoopRunning=false; 
        if(gameState==='START' && allAssetsReady){
            const gC=getCurrentGameCharacter();
            if(gC && gC.isReady){ isStartScreenLoopRunning=true; startScreenAnimationLoop(); }
            if(backgroundMusic.isReady && backgroundMusic.paused){ playSound(backgroundMusic); }
        }
    }
    function startGame() {
        isStartScreenLoopRunning=false;
        if(ctx)ctx.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT);
        gameState='PLAYING';
        showScreen(null); 
        rocket=new Rocket(); 
        obstacles=[]; powerUps=[]; particles=[];
        score=0; frame=0; gameSpeed = OBSTACLE_SPEED_INITIAL;
        canSpawnEmergencyBeans=true; emergencyBeansCooldownTimer=0;

        const firstObstacleX = GAME_WIDTH * INITIAL_OBSTACLE_X_POSITION_FACTOR;
        const oTK = Object.keys(OBSTACLE_TYPES); const rT = oTK[Math.floor(Math.random() * oTK.length)];
        const mGC = OBSTACLE_GAP / 2 + MIN_OBSTACLE_SEGMENT_HEIGHT + 20; const xGC = GAME_HEIGHT - (OBSTACLE_GAP / 2 + MIN_OBSTACLE_SEGMENT_HEIGHT + 20);
        const range = xGC - mGC; let iGY = (range > 0) ? (Math.random() * range + mGC) : (GAME_HEIGHT / 2);
        const mV = Math.random() < 0.4;
        obstacles.push(new Obstacle(firstObstacleX, iGY, mV, rT));

        updateUI(rocket);
        if(backgroundMusic.isReady && backgroundMusic.paused){ playSound(backgroundMusic); }
        gameLoop();
    }
    async function gameOver() { 
        if (currentlyPlayingFuelEmptySound && !currentlyPlayingFuelEmptySound.paused) {
            currentlyPlayingFuelEmptySound.pause();
            currentlyPlayingFuelEmptySound.currentTime = 0;
            currentlyPlayingFuelEmptySound = null;
        }
        playGameOverSound(); 
        gameState='GAMEOVER';
        const earnedScore = score; 
        coins+=earnedScore; saveCoins(); updateCoinDisplay();
        if(coinsEarnedDisplay)coinsEarnedDisplay.textContent=earnedScore;
        if(rocket){for(let i=0;i<50;i++){particles.push(new Particle(rocket.x+rocket.width/2,rocket.y+rocket.height/2,'explosion'));} rocket=null;}
        
        let isNewWorldRecord = false;
        if (earnedScore > highScore) {
            highScore = earnedScore;
            saveHighScore();
            if(newHighScoreTextGameOver)newHighScoreTextGameOver.style.display='block';
        } else {
            if(newHighScoreTextGameOver)newHighScoreTextGameOver.style.display='none';
        }
        
        if (db && localPlayerId && localPlayerDisplayName && localPlayerDisplayName !== 'Player' && earnedScore > 0) { 
            isNewWorldRecord = await submitScoreToFirebase(localPlayerId, localPlayerDisplayName, earnedScore);
            if (isNewWorldRecord) {
                playSound(sounds.purchase); 
                const championLali = getCharacterById('lali_champion');
                if (championLali) {
                    championLali.unlocked = true;
                    saveCharacterData(); 
                }
                if(newWorldHighScorePopup) newWorldHighScorePopup.style.display = 'flex';
            }
        }

        if(finalScoreDisplay)finalScoreDisplay.textContent=earnedScore;
        showScreen(gameOverScreen);
        updateUI(null);
    }

    function drawBackground() { if(!ctx)return; if(backgroundImg.isReady && backgroundImg.complete && backgroundImg.naturalWidth > 0){ ctx.drawImage(backgroundImg, backgroundX, 0, backgroundImg.width, GAME_HEIGHT); if (backgroundX < 0) { ctx.drawImage(backgroundImg, backgroundX + backgroundImg.width, 0, backgroundImg.width, GAME_HEIGHT); } } else { ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT); }}
    function handleInput(e) { if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp' || e.type === 'mousedown' || e.type === 'touchstart') { e.preventDefault(); if (gameState === 'PLAYING' && rocket) { rocket.flap(); }}}
    
    function generateObstacles() { 
        if (obstacles.length > 0 && frame % Math.floor(OBSTACLE_SPACING / gameSpeed) === 0) {
            // Standard generation
        } else if (obstacles.length === 0 && frame > 10) { 
             // This condition might be redundant if startGame always adds one.
        } else {
            return; 
        }
        const oTK=Object.keys(OBSTACLE_TYPES);const rT=oTK[Math.floor(Math.random()*oTK.length)];
        const mGC=OBSTACLE_GAP/2+MIN_OBSTACLE_SEGMENT_HEIGHT+20; const xGC=GAME_HEIGHT-(OBSTACLE_GAP/2+MIN_OBSTACLE_SEGMENT_HEIGHT+20);
        const range=xGC-mGC;let iGY=(range>0)?(Math.random()*range+mGC):(GAME_HEIGHT/2);
        const mV=Math.random()<0.4;
        obstacles.push(new Obstacle(GAME_WIDTH, iGY, mV, rT));
    }
    
    function generatePowerUps() { 
        if (Math.random() < powerUpSpawnChance) {
            const pUT = Math.random() < 0.5 ? 'shield' : 'fuel';
            const pUY = Math.random() * (GAME_HEIGHT - OBSTACLE_GAP - FUEL_POWERUP_SIZE * 2) + OBSTACLE_GAP / 2;
            powerUps.push(new PowerUp(GAME_WIDTH, pUY, pUT));
        }
    }

    function trySpawnEmergencyBeans() {
        if (emergencyBeansCooldownTimer > 0) {
            emergencyBeansCooldownTimer--;
            if (emergencyBeansCooldownTimer === 0) { 
                canSpawnEmergencyBeans = true;     
            }
            return; 
        }
    
        if (rocket && rocket.fuel / MAX_FUEL * 100 < LOW_FUEL_THRESHOLD_PERCENT && canSpawnEmergencyBeans && obstacles.length > 0) {
            const lO = obstacles[obstacles.length - 1]; 
            if (lO.x < GAME_WIDTH * 0.7) { 
                const pX = lO.x + OBSTACLE_SPACING / 2; 
                const pY = Math.random() * (GAME_HEIGHT * 0.6) + GAME_HEIGHT * 0.2; 
                powerUps.push(new PowerUp(pX, pY, 'fuel'));
                
                canSpawnEmergencyBeans = false; 
                emergencyBeansCooldownTimer = EMERGENCY_BEANS_COOLDOWN_FRAMES; 
            }
        }
    }


    function checkCollisions() { 
        if(!rocket||gameState!=='PLAYING')return; 
        if(rocket.y+rocket.height>=GAME_HEIGHT){rocket.y=GAME_HEIGHT-rocket.height;rocket.velocityY=0;if(!rocket.shieldActive){gameOver();return;}else{rocket.velocityY=FLAP_STRENGTH*0.3;playSound(sounds.hit);}} 
        for(let o of obstacles){
            const rR={x:rocket.x,y:rocket.y,width:rocket.width,height:rocket.height};
            const oCX=o.x+o.hitboxInsetX;const oCW=o.effectiveWidth-2*o.hitboxInsetX;
            const tPR={x:oCX,y:o.topPart.y,width:oCW,height:o.topPart.height-o.hitboxInsetYGapEdge};
            if(tPR.height<0)tPR.height=0;
            if(!rocket.shieldActive&&rR.x<tPR.x+tPR.width&&rR.x+rR.width>tPR.x&&rR.y<tPR.y+tPR.height&&rR.y+rR.height>tPR.y){gameOver();return;}
            const bPR={x:oCX,y:o.bottomPart.y+o.hitboxInsetYGapEdge,width:oCW,height:o.bottomPart.height-o.hitboxInsetYGapEdge};
            if(bPR.height<0)bPR.height=0;
            if(!rocket.shieldActive&&rR.x<bPR.x+bPR.width&&rR.x+rR.width>bPR.x&&rR.y<bPR.y+bPR.height&&rR.y+rR.height>bPR.y){gameOver();return;}
            
            if(!o.passed&&o.x+o.effectiveWidth<rocket.x){
                o.passed=true;score++;playSound(sounds.score);
                if (score > 0 && score % SPEED_INCREMENT_OBSTACLE_COUNT === 0 && score <= MAX_SPEED_OBSTACLE_THRESHOLD) {
                    if (gameSpeed < MAX_GAME_SPEED) {
                        gameSpeed += SPEED_INCREMENT;
                        gameSpeed = Math.min(gameSpeed, MAX_GAME_SPEED); 
                    }
                }
            }
        } 
        powerUps = powerUps.filter(pU => !pU.collected); 
        for(let pU of powerUps){const rocketRect={x:rocket.x,y:rocket.y,width:rocket.width,height:rocket.height}; if(!pU.collected&&rocketRect.x<pU.x+pU.size&&rocketRect.x+rocketRect.width>pU.x&&rocketRect.y<pU.y+pU.size&&rocketRect.y+rocketRect.height>pU.y)pU.applyEffect(rocket);}}
    
    function updateGameObjects() { if(gameState!=='PLAYING')return; if(rocket)rocket.update(); obstacles.forEach(o=>o.update()); powerUps.forEach(pU=>pU.update()); particles=particles.filter(p=>p.life>0); particles.forEach(p=>p.update()); if(backgroundImg.isReady){backgroundX-=gameSpeed*BACKGROUND_SCROLL_SPEED_FACTOR;if(backgroundX<=-backgroundImg.width){backgroundX+=backgroundImg.width;}}}
    function drawGameObjects() { if(!ctx)return; ctx.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT); drawBackground(); obstacles.forEach(o=>o.draw()); powerUps.forEach(pU=>pU.draw()); if(gameState==='PLAYING'&&rocket)rocket.draw(); particles.forEach(p=>p.draw());}
    function gameLoop() { if(gameState!=='PLAYING')return; frame++; generateObstacles(); if(frame%75===0)generatePowerUps(); trySpawnEmergencyBeans(); updateGameObjects(); checkCollisions(); drawGameObjects(); updateUI(rocket); requestAnimationFrame(gameLoop);}
    function updateUI(cR) { if(scoreDisplay)scoreDisplay.textContent=`Score: ${score}`; if(highScoreDisplay)highScoreDisplay.textContent=`High Score: ${highScore}`; updateCoinDisplay(); let fS=cR||(rocket?rocket:{fuel:MAX_FUEL}); if(fuelBar){if(fS){const fP=(fS.fuel/MAX_FUEL)*100;fuelBar.style.width=`${fP}%`;if(fP<LOW_FUEL_THRESHOLD_PERCENT)fuelBar.style.backgroundColor='#d63031';else if(fP<50)fuelBar.style.backgroundColor='#fdcb6e';else fuelBar.style.backgroundColor='#e17055';}else{fuelBar.style.width='100%';fuelBar.style.backgroundColor='#e17055';}}}

    // --- EVENT LISTENERS ---
    if(startButton)startButton.addEventListener('click',startGame); 
    if(restartButton)restartButton.addEventListener('click',initGame);
    
    if(shopButton)shopButton.addEventListener('click',()=>{ isStartScreenLoopRunning=false; if(ctx)ctx.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT); showScreen(shopScreen); renderCharacterShop();updateShopPreview(shopPreviewCharacterId);updateCoinDisplay(); });
    if(backToMenuButtonFromShop)backToMenuButtonFromShop.addEventListener('click',()=> { showScreen(startScreen); if(initialAssetsHaveLoaded && gameState === 'START') {isStartScreenLoopRunning=true; startScreenAnimationLoop();} });

    if(settingsButton)settingsButton.addEventListener('click', () => { isStartScreenLoopRunning=false; if(ctx)ctx.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT); showScreen(settingsScreen);});
    if(backToMenuButtonFromSettings)backToMenuButtonFromSettings.addEventListener('click',()=> { saveSettings(); showScreen(startScreen); if(initialAssetsHaveLoaded && gameState === 'START') {isStartScreenLoopRunning=true; startScreenAnimationLoop();} });
    
    if(leaderboardButton)leaderboardButton.addEventListener('click', () => { isStartScreenLoopRunning=false; if(ctx)ctx.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT); showScreen(leaderboardScreen); fetchLeaderboard(); });
    if(backToMenuButtonFromLeaderboard)backToMenuButtonFromLeaderboard.addEventListener('click',()=> { showScreen(startScreen); if(initialAssetsHaveLoaded && gameState === 'START') {isStartScreenLoopRunning=true; startScreenAnimationLoop();} });

    if(saveDisplayNameButton) saveDisplayNameButton.addEventListener('click', savePlayerDisplayName);
    if(masterVolumeSlider) masterVolumeSlider.addEventListener('input', (e) => { masterVolume = parseFloat(e.target.value); applyVolumeSettings(); });
    if(musicVolumeSlider) musicVolumeSlider.addEventListener('input', (e) => { musicVolume = parseFloat(e.target.value); applyVolumeSettings(); });
    if(sfxVolumeSlider) sfxVolumeSlider.addEventListener('input', (e) => { sfxVolume = parseFloat(e.target.value); applyVolumeSettings(); });

    if(redeemCodeButton)redeemCodeButton.addEventListener('click',handleRedeemCode);
    if(redeemCodeInput)redeemCodeInput.addEventListener('keypress',(e)=>{if(e.key==='Enter'){handleRedeemCode();}});
    
    if(scrollToUserButton) scrollToUserButton.addEventListener('click', () => {
        const userEntry = document.getElementById('userLeaderboardEntry');
        if (userEntry) {
            userEntry.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    if(closeNewWorldHighScorePopup) closeNewWorldHighScorePopup.addEventListener('click', () => {
        if(newWorldHighScorePopup) newWorldHighScorePopup.style.display = 'none';
    });

    window.addEventListener('keydown',handleInput); 
    if(canvas){canvas.addEventListener('mousedown',handleInput);canvas.addEventListener('touchstart',handleInput,{passive:false});}

    // --- INITIALIZATION ---
    loadGameData(); 
    if(startButton)startButton.disabled=true;
    if(shopButton)shopButton.disabled=true;
    if(settingsButton)settingsButton.disabled=true;
    if(leaderboardButton)leaderboardButton.disabled=true;
    if(redeemCodeButton)redeemCodeButton.disabled=true; 
    
    window.flappyLaliControls = {
        setPowerupSpawnRate: function(newRate) {
            if (typeof newRate === 'number' && newRate >= 0 && newRate <= 1) {
                powerUpSpawnChance = newRate;
                console.log(`Power-up spawn chance set to: ${powerUpSpawnChance.toFixed(4)} (Value from 0.0 to 1.0)`);
            } else {
                console.warn(`Invalid spawn rate: ${newRate}. Please provide a number between 0.0 (0%) and 1.0 (100%).`);
            }
        },
        getPowerupSpawnRate: function() {
            console.log(`Current power-up spawn chance: ${powerUpSpawnChance.toFixed(4)}`);
            return powerUpSpawnChance;
        },
        saveCurrentSettings: function() {
            saveSettings(); 
            console.log("All current game settings (including spawn rate) have been saved to localStorage.");
        },
        logCurrentRates: function() { 
            console.log(`Current Power-up Spawn Chance: ${powerUpSpawnChance.toFixed(4)} (Value from 0.0 to 1.0)`);
            console.log("This chance is applied approximately every 75 game frames when power-up generation is attempted.");
            console.log("Example: 0.01 = 1% chance, 0.1 = 10% chance per attempt.");
        }
    };
    console.log("Flappy Lali controls available via `window.flappyLaliControls` in console.");
    console.log("Use `flappyLaliControls.setPowerupSpawnRate(0.05)` to change rate.");
    console.log("Use `flappyLaliControls.getPowerupSpawnRate()` to view current rate.");
    console.log("Use `flappyLaliControls.saveCurrentSettings()` to persist changes.");
    console.log("Use `flappyLaliControls.logCurrentRates()` for a reminder.");

}); // End of DOMContentLoaded
