import { AudioManager } from '../managers/AudioManager';

export class MascotManager {
  private container: HTMLElement;
  private graphic: HTMLElement;
  private stars: HTMLElement;
  private zzz: HTMLElement | null = null;
  private notes: HTMLElement | null = null;
  private playBtn: HTMLElement;
  private loadingContainer: HTMLElement;

  private pos = { x: -100, y: -100 };
  private rotY = 0;
  private rotZ = 0;
  private rotX = 0;
  private state:
    | 'loading'
    | 'flying'
    | 'idle'
    | 'acting'
    | 'falling'
    | 'dizzy'
    | 'sleeping'
    | 'dragging' = 'loading';
  private idleTimer: any = null;
  private dashLines: HTMLElement[] = [];
  private lastBarY = 0;
  private initialized = false;
  private pokeCount = 0;
  private pokeTimer: any = null;
  private actionTimer: any = null;

  // Dragging
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private dragOffset = { x: 0, y: 0 };
  private hasMoved = false; // To distinguish click vs drag

  constructor() {
    this.container = document.getElementById('mascot-container')!;
    this.graphic = document.getElementById('mascot-graphic')!;
    this.stars = document.querySelector('.stars-container') as HTMLElement;
    this.playBtn = document.getElementById('play-btn')!;
    this.loadingContainer = document.getElementById('loading-container')!;
    this.zzz = this.container.querySelector('.zzz-container');
    this.notes = this.container.querySelector('.notes-container');

    // Pre-create dash lines for dash effect
    this.createDashLines();

    // Create Anger Mark
    const angerMark = document.createElement('div');
    angerMark.className = 'anger-mark';
    this.container.appendChild(angerMark);

    this.init();
  }

  private createDashLines() {
    const linesContainer = document.createElement('div');
    linesContainer.className = 'mascot-dash-lines';
    for (let i = 0; i < 5; i++) {
      const line = document.createElement('div');
      line.className = `mascot-dash-line line-${i + 1}`;
      linesContainer.appendChild(line);
      this.dashLines.push(line);
    }
    this.container.appendChild(linesContainer);
  }

  private init() {
    if (!this.container) return;

    // Initial state: Hidden and no transition to allow instant teleport to start position
    this.container.style.opacity = '0';
    this.container.style.transition = 'none';

    // Mouse Events
    this.container.addEventListener('mousedown', (e) => this.onDragStart(e));
    window.addEventListener('mousemove', (e) => this.onDragMove(e));
    window.addEventListener('mouseup', (e) => this.onDragEnd(e));

    // Touch Events
    this.container.addEventListener('touchstart', (e) => this.onDragStart(e), {
      passive: false,
    });
    window.addEventListener('touchmove', (e) => this.onDragMove(e), {
      passive: false,
    });
    window.addEventListener('touchend', (e) => this.onDragEnd(e));

    // Resize / Orientation change
    window.addEventListener('resize', () => {
      // Small timeout to allow browser layout to stabilize
      setTimeout(() => this.handleResize(), 100);
    });

    this.startBlinking();
  }

  private handleResize() {
    if (this.state === 'loading') {
      const bar = document.getElementById('loading-bar');
      if (bar) {
        const rect = bar.getBoundingClientRect();
        this.lastBarY = rect.top;
        this.pos.x = rect.left + rect.width - 35;
        this.pos.y = rect.top - 20;
        this.apply();
      }
    } else if (
      this.state === 'idle' ||
      this.state === 'sleeping' ||
      this.state === 'acting'
    ) {
      // Relocate to button
      const btnRect = this.playBtn.getBoundingClientRect();
      if (btnRect.width > 0) {
        this.container.style.transition = 'none';
        this.pos.x = btnRect.left + btnRect.width / 2 - 35;
        this.pos.y = this.getHomeY();
        this.apply();
      }
    }

    // Update lastBarY reference for general use
    const barRect = this.loadingContainer.getBoundingClientRect();
    if (barRect.height > 0) {
      this.lastBarY = barRect.top;
    }
  }

  // --- Drag & Drop Logic ---

  private onDragStart(e: MouseEvent | TouchEvent) {
    e.stopPropagation(); // Always stop propagation so background menu doesn't catch it

    if (this.state !== 'idle' && this.state !== 'sleeping') return;

    e.preventDefault();

    // Get client coordinates
    const clientX =
      (e as MouseEvent).clientX || (e as TouchEvent).touches[0].clientX;
    const clientY =
      (e as MouseEvent).clientY || (e as TouchEvent).touches[0].clientY;

    this.isDragging = true;
    this.hasMoved = false;
    this.dragStart = { x: clientX, y: clientY };

    // Calculate offset from top-left of mascot
    const rect = this.container.getBoundingClientRect();
    this.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    // If sleeping, wake up immediately but allow drag
    if (this.state === 'sleeping') {
      this.wakeUp();
      // Don't return, allow dragging immediately
    }

    // Pause idle animations
    clearTimeout(this.idleTimer);

    // Add grabbing visual
    this.container.classList.add('is-dragging');
  }

  private onDragMove(e: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    const clientX =
      (e as MouseEvent).clientX || (e as TouchEvent).touches[0].clientX;
    const clientY =
      (e as MouseEvent).clientY || (e as TouchEvent).touches[0].clientY;

    // Check if actually moved (threshold to prevent jitter being counted as drag)
    if (
      Math.abs(clientX - this.dragStart.x) > 5 ||
      Math.abs(clientY - this.dragStart.y) > 5
    ) {
      this.hasMoved = true;
      this.state = 'dragging'; // Set state to dragging to prevent other updates
    }

    if (this.hasMoved) {
      this.pos.x = clientX - this.dragOffset.x;
      this.pos.y = clientY - this.dragOffset.y;
      this.apply();
    }
  }

  private onDragEnd(_e: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.container.classList.remove('is-dragging');

    if (!this.hasMoved) {
      // Treat as Click/Poke
      this.state = 'idle'; // Reset state
      this.handleInteraction();
    } else {
      // Handle Drop
      this.handleDrop();
    }
  }

  private handleDrop() {
    // Check collision with Play Button
    const btnRect = this.playBtn.getBoundingClientRect();
    const mascotRect = this.container.getBoundingClientRect();

    // Calculate center distance
    const mascotCX = mascotRect.left + mascotRect.width / 2;

    // Landing Zone: Play Button Column
    const isOverButton = mascotCX >= btnRect.left && mascotCX <= btnRect.right;

    // Visual Fall Speed dependent on height approx (0.5s is good average)
    this.container.style.transition = 'top 0.5s ease-in, left 0.5s linear';
    this.state = 'falling';

    if (isOverButton) {
      // FALL TO BUTTON
      const targetY = btnRect.top - 50;

      // If we are below the button, jump up to it?
      // The user said "drag up then logic", so assume we are above.
      // But if below, let's just snap for simplicity or animate up.
      // Let's assume typical drag up and drop.

      this.pos.x = btnRect.left + btnRect.width / 2 - 35; // Center X
      this.pos.y = targetY;
      this.apply();

      // On Land
      setTimeout(() => {
        this.state = 'idle';
        this.container.style.transition = 'none';
        this.startIdle();
        AudioManager.getInstance().play('jump'); // Success hop
      }, 500);
    } else {
      // Chance to recover mid-air! (Surprise factor - 40%)
      if (Math.random() < 0.4) {
        this.setMood('happy'); // Phew!

        // Fall a little bit first for realism (animation frame)
        this.container.style.transition = 'top 0.2s ease-in';

        // We don't want to set pos.y directly if we want to interrupt a long fall?
        // Actually, let's let the fall happen for 200ms, THEN interrupt.
        // The current fall target is floorY, so it's animating there.

        setTimeout(() => {
          // Interrupt Fall!
          this.syncPositionFromDOM(); // CRITICAL: Update pos to where we are NOW

          this.rotX = 0; // Ensure no rotation before flying
          this.apply();

          AudioManager.getInstance().play('jump');
          this.flyToButton();
        }, 200);
        return;
      }

      // THROWN AWAY -> Fall Epic logic
      this.state = 'falling';
      this.setMood('sad'); // Regret getting thrown

      // FALL TO DEATH
      // Safe floor level: Try loading bar, but cap it so mascot stays visible.
      // Mascot container is 70px, scaled 0.5. To be safe, we want bottom of container
      // to be at most window.innerHeight - 10px.
      const rawFloorY = (this.lastBarY || window.innerHeight - 100) - 20;
      const floorY = Math.min(rawFloorY, window.innerHeight - 75);

      // Longer fall if high up
      this.container.style.transition =
        'top 0.6s cubic-bezier(0.6, 0.04, 0.98, 0.335)';
      this.pos.y = floorY;
      this.rotX = 180; // Turn upside down (Faceplant) like ActionFallEpic
      this.apply();

      setTimeout(() => {
        // SPLAT
        AudioManager.getInstance().play('hit');
        AudioManager.getInstance().play('stunt');

        // Trigger Dizzy State manually
        this.state = 'dizzy';
        // Keep rotX = 180 (Upside down) instead of squashing it

        this.container.classList.add('dizzy-eyes'); // Use CSS class for dizzy eyes if available
        this.apply();

        // Add stars visual
        this.container.classList.add('is-dizzy');
        this.stars.style.display = 'block';

        // Recovery after stunned
        setTimeout(() => {
          this.container.classList.remove('is-dizzy', 'dizzy-eyes');
          this.stars.style.display = 'none';

          this.rotX = 0;
          this.syncPositionFromDOM(); // Lock position before jump
          this.apply();

          // Recover jump to button using the nice arc animation
          AudioManager.getInstance().play('jump');
          this.flyToButton();
        }, 2000); // Stay stunned for 2s
      }, 600);
    }
  }

  private startBlinking() {
    const blink = () => {
      if (this.state !== 'dizzy' && this.state !== 'sleeping') {
        this.container.classList.add('blinking');
        setTimeout(() => this.container.classList.remove('blinking'), 200);
      }
      setTimeout(() => blink(), 1000 + Math.random() * 3000);
    };
    blink();
  }

  updatePosition(progress: number) {
    if (this.state !== 'loading') return;

    const barRect = this.loadingContainer.getBoundingClientRect();
    this.lastBarY = barRect.top;

    // Exact alignment: centered on the progress tip
    const nextX = barRect.left + barRect.width * (progress / 100) - 35;
    // lowered offset from 35 to 20 to sit deeper/lower on the bar
    const nextY = this.lastBarY - 20;

    if (Math.abs(nextX - this.pos.x) > 0.1) {
      this.rotY = nextX > this.pos.x ? 0 : 180;
    }
    this.pos.x = nextX;
    this.pos.y = nextY;
    this.apply();

    // On first valid position update:
    // 1. Instant teleport (already applied above)
    // 2. Force Layout
    // 3. Enable Transitions
    // 4. Fade In
    if (!this.initialized) {
      // Force reflow to ensure the instant position is rendered before transition is enabled
      void this.container.offsetWidth;

      // Now enable smooth movement for subsequent updates
      this.container.style.transition =
        'left 0.1s linear, top 0.1s linear, opacity 0.5s ease-out';

      // Trigger fade in
      this.container.style.opacity = '1';

      this.initialized = true;
    }
  }

  private syncPositionFromDOM() {
    // Force browser to update styles
    const computedStyle = window.getComputedStyle(this.container);

    // Since we use top/left for position:
    this.pos.x = parseFloat(computedStyle.left);
    this.pos.y = parseFloat(computedStyle.top);

    // Disable transition immediately to lock this position
    this.container.style.transition = 'none';
    this.apply();
    // Force reflow
    void this.container.offsetWidth;
  }

  private apply() {
    this.container.style.left = `${this.pos.x}px`;
    this.container.style.top = `${this.pos.y}px`;
    this.graphic.style.transform = `rotateY(${this.rotY}deg) rotateZ(${this.rotZ}deg) rotateX(${this.rotX}deg)`;
  }

  private getHomeY(): number {
    const btnRect = this.playBtn.getBoundingClientRect();
    if (btnRect.width === 0) return this.pos.y; // Fallback if hidden
    const targetY = btnRect.top - 60;
    return Math.max(10, targetY);
  }

  public setVisible(visible: boolean) {
    this.container.style.display = visible ? 'block' : 'none';
    if (visible) {
      // Force a refresh of position when showing back
      this.handleResize();
    }
  }

  onLoadComplete() {
    this.rotY = 180; // Turn to look at menu
    this.apply();
    setTimeout(() => {
      AudioManager.getInstance().play('jump');
      this.flyToButton();
    }, 800);
  }

  private flyToButton() {
    this.state = 'flying';
    this.container.classList.add('flapping');

    // Disable transitions on both container and graphic to snap state
    this.container.style.transition = 'none';
    this.graphic.style.transition = 'none'; // CRITICAL FIX: Kill rotation transition

    this.rotX = 0; // Ensure flat
    this.apply(); // Force apply immediately

    // Force reflow
    void this.graphic.offsetWidth;

    // Re-enable graphic transition for smooth turning (yaw/roll) during flight
    // But maybe we don't need it?
    // Actually, let's keep it disabled for X to stay 0, but Y/Z are updated every frame by JS anyway
    // So we can leave it disabled or re-enable it.
    // Best to leave it disabled because our JS loop handles the smoothing of movement curve,
    // though Y/Z smoothing might be desired if we didn't calculate them every frame.
    // Since we calculate them every frame, we do NOT want CSS transition fighting us.

    // HOWEVER, the original code had: transition: transform 0.3s ... in CSS
    // We will keep it disabled for this flight.

    // Play jump sound when taking off from loading bar
    // AudioManager.getInstance().play('jump'); // Handled by caller to avoid double play

    const btnRect = this.playBtn.getBoundingClientRect();
    const startX = this.pos.x;
    const startY = this.pos.y;
    const endX = btnRect.left + btnRect.width / 2 - 35;
    const targetY = btnRect.top - 60; // Slightly above button
    const endY = Math.max(10, targetY); // Safety for narrow landscape screens

    let startTime: number | null = null;
    const duration = 1200;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const p = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);

      const nextX = startX + (endX - startX) * ease;
      const nextY =
        startY + (endY - startY) * ease - Math.sin(p * Math.PI) * 150;

      const deltaX = nextX - this.pos.x;
      if (Math.abs(deltaX) > 0.01) {
        this.rotY = deltaX > 0 ? 0 : 180;
      }
      this.rotZ = deltaX * 2.5;

      this.pos.x = nextX;
      this.pos.y = nextY;

      this.apply();

      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.classList.remove('flapping');
        this.container.style.pointerEvents = 'auto';
        this.rotZ = 0;

        // Restore default transition for idle behavior
        this.graphic.style.transition = '';

        this.apply();
        this.startIdle();
      }
    };
    requestAnimationFrame(animate);
  }

  private startIdle() {
    this.state = 'idle';
    this.rotX = 0;
    this.rotZ = 0;
    this.setMood('normal');
    this.apply();

    // Random behaviors loop
    const loop = () => {
      if (this.state !== 'idle' && this.state !== 'sleeping') return;

      // If sleeping, long pause or wake up
      if (this.state === 'sleeping') {
        if (Math.random() < 0.1) this.wakeUp();
        this.idleTimer = setTimeout(loop, 3000);
        return;
      }

      const rand = Math.random();
      const btnRect = this.playBtn.getBoundingClientRect();
      if (btnRect.width === 0) {
        this.idleTimer = setTimeout(loop, 3000);
        return;
      }
      const centerX = btnRect.left + btnRect.width / 2 - 35;
      const homeY = this.getHomeY();

      // 1. Movement: Hop around the button (50%)
      if (rand < 0.5) {
        const nextX = centerX + (Math.random() - 0.5) * (btnRect.width - 20);
        this.rotY = nextX > this.pos.x ? 0 : 180;
        this.pos.x = nextX;
        this.pos.y = homeY; // Correct any vertical drift
        this.container.style.transition =
          'left 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), top 0.6s ease';
        this.apply();
        setTimeout(() => {
          if (this.state === 'idle') this.container.style.transition = 'none';
        }, 600);
      }
      // 2. Jump: Happy hop (15%) -> 50 + 15 = 65
      else if (rand < 0.65) {
        this.setMood('happy');
        this.pos.y = homeY - 25;
        this.container.style.transition = 'top 0.25s ease-out';
        this.apply();
        setTimeout(() => {
          this.pos.y = homeY;
          this.container.style.transition = 'top 0.25s ease-in';
          this.apply();
          setTimeout(() => {
            if (this.state === 'idle') {
              this.container.style.transition = 'none';
              this.setMood('normal');
            }
          }, 250);
        }, 250);
      }
      // 3. Singing: Sing with music notes (15%) -> 65 + 15 = 80
      else if (rand < 0.8) {
        this.actionSing(2000);
      }
      // 4. Sleep: Zzz (5%) -> 80 + 5 = 85
      else if (rand < 0.85) {
        this.goSleep();
      }
      // 5. Look around / Sad
      else {
        this.setMood('sad');
        this.rotY = this.rotY === 0 ? 180 : 0;
        this.apply();
        setTimeout(() => this.setMood('normal'), 2000);
      }

      this.idleTimer = setTimeout(loop, 2000 + Math.random() * 3000);
    };
    loop();
  }

  private setMood(mood: 'normal' | 'happy' | 'sad') {
    this.graphic.classList.remove('is-happy', 'is-sad');
    if (mood !== 'normal') this.graphic.classList.add(`is-${mood}`);
  }

  private actionHoot() {
    this.actionSing(1500);
  }

  private actionSing(duration: number) {
    if (this.state !== 'idle') return;
    this.state = 'acting';

    this.graphic.classList.add('singing');
    if (this.notes) this.notes.style.display = 'block';

    setTimeout(() => {
      this.graphic.classList.remove('singing');
      if (this.notes) this.notes.style.display = 'none';
      this.startIdle();
    }, duration);
  }

  private goSleep() {
    if (this.state !== 'idle') return;
    this.state = 'sleeping';
    this.graphic.classList.add('is-sleeping');
    if (this.zzz) this.zzz.style.display = 'flex';
  }

  private wakeUp() {
    if (this.state !== 'sleeping') return;
    this.state = 'idle';
    this.graphic.classList.remove('is-sleeping');
    if (this.zzz) this.zzz.style.display = 'none';

    // Wake up grouchy or Happy
    this.setMood(Math.random() > 0.5 ? 'sad' : 'happy');
    this.actionHoot();
  }

  private handleInteraction() {
    clearTimeout(this.idleTimer);

    // Reset poke count if too much time passed since last poke
    clearTimeout(this.pokeTimer);
    this.pokeTimer = setTimeout(() => {
      this.pokeCount = 0;
    }, 800);

    this.pokeCount++;

    // STAGE 2: FURIOUS (5+ clicks) -> Tantrum / Fall Epic
    if (this.pokeCount >= 5) {
      // Cancel any pending normal actions
      if (this.actionTimer) clearTimeout(this.actionTimer);

      this.wakeUp(); // Ensure awake
      this.pokeCount = 0;
      this.setMood('sad'); // Make an angry/sad face before falling
      this.actionFallEpic();
      return;
    }

    // STAGE 1: ANNOYED (2-4 clicks) -> Angry Face & Shake
    if (this.pokeCount >= 2) {
      // Cancel pending action to prioritize annoyance
      if (this.actionTimer) clearTimeout(this.actionTimer);

      this.setMood('sad'); // Uses 'sad' style for angry face
      this.container.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`; // Shake
      setTimeout(() => {
        this.container.style.transform = 'none';
        // Don't reset mood immediately, let it linger a bit
      }, 100);
      return;
    }

    if (this.state === 'sleeping') {
      this.wakeUp();
      return;
    }

    // If we are already acting (e.g. from previous click), interrupt it only if it's a "soft" act
    // But for spam clicking, we want to allow the clicks to accumulate.
    // So:
    // 1. If this is the FIRST click, schedule a normal action with a small delay.
    // 2. If subsequent clicks happen within that delay, CANCEL the normal action and wait for more clicks.

    if (this.pokeCount === 1) {
      this.actionTimer = setTimeout(() => {
        if (this.state !== 'idle') return;
        this.triggerRandomReaction();
      }, 300); // 300ms delay to check if user is spamming
    } else {
      // User is spamming, cancel normal reaction to allow build-up
      clearTimeout(this.actionTimer);

      // Small "ouch" or shake effect for feedback could go here
      this.container.classList.add('blinking');
      setTimeout(() => this.container.classList.remove('blinking'), 100);
    }
  }

  private triggerRandomReaction() {
    if (this.state !== 'idle') return;
    // Normal Interaction
    const rand = Math.random();
    // Slightly increase jump chance on single click to make it feel responsive
    if (rand < 0.7) this.actionJump();
    else if (rand < 0.9)
      this.actionSing(1000); // Short sing
    else this.actionDash();
  }

  private actionJump() {
    if (this.state !== 'idle') return;
    this.state = 'acting';
    this.container.classList.add('flapping');
    const homeY = this.getHomeY();

    this.container.style.transition = 'top 0.4s ease-out';
    this.pos.y = homeY - 100;
    this.apply();
    AudioManager.getInstance().play('jump');

    setTimeout(() => {
      if (this.state !== 'acting') return;
      this.container.style.transition = 'top 0.4s ease-in';
      this.pos.y = homeY;
      this.apply();
      setTimeout(() => {
        if (this.state === 'acting') {
          this.container.classList.remove('flapping');
          this.container.style.transition = 'none';
          this.startIdle();
        }
      }, 400);
    }, 400);
  }

  private actionFallEpic() {
    if (this.state !== 'idle') return;
    this.state = 'falling';
    // Use cached lastBarY with a safety cap for landscape mode
    const rawLandY = (this.lastBarY || window.innerHeight - 100) - 48;
    const landY = Math.min(rawLandY, window.innerHeight - 75);

    // Fall down animation
    this.container.style.transition =
      'top 0.7s cubic-bezier(0.6, 0.04, 0.98, 0.335), left 0.7s ease-out';
    this.pos.y = landY;
    this.pos.x += (Math.random() - 0.5) * 40; // Slight drift
    this.rotX = 180;
    this.apply();
    AudioManager.getInstance().play('die');

    setTimeout(() => {
      AudioManager.getInstance().play('hit'); // Sound when hitting the ground
      AudioManager.getInstance().play('stunt'); // NEW: Plays stun sound effect
      this.state = 'dizzy';
      this.container.classList.add('stun-active', 'upside-down-stars');
      this.stars.style.display = 'block';
      this.container.classList.add('dizzy-eyes');

      this.apply();

      setTimeout(() => {
        this.stars.style.display = 'none';
        this.container.classList.remove(
          'dizzy-eyes',
          'stun-active',
          'upside-down-stars'
        );

        this.rotX = 0;
        this.syncPositionFromDOM();
        this.apply();

        // Jump back to button
        AudioManager.getInstance().play('jump');
        this.flyToButton();
      }, 2000);
    }, 700);
  }

  private actionDash() {
    if (this.state !== 'idle') return;
    this.state = 'acting';
    this.container.classList.add('flapping', 'dashing');

    const screenW = window.innerWidth;
    const btnRect = this.playBtn.getBoundingClientRect();
    const landX = btnRect.left + btnRect.width / 2 - 35;
    const targetY = btnRect.top - 60;
    const landY = Math.max(10, targetY); // Safety cap

    // Force dash direction logic
    // If left of center, dash right. If right of center, dash left.
    // This ensures it always dashes across the screen or towards open space.

    /* 
           ORIGINAL LOGIC FIX:
           If facing Right (rotY=0), targetX should be Positive (Right).
           If facing Left (rotY=180), targetX should be Negative (Left).
           We enforce this sync.
        */

    const isFacingRight = this.rotY === 0;
    const targetX = isFacingRight ? screenW + 150 : -150;

    // Slowed down dash (merged requested "slower" feel)
    this.container.style.transition = 'left 0.7s ease-in';
    this.pos.x = targetX;
    this.rotZ = isFacingRight ? 30 : -30;
    this.apply();
    AudioManager.getInstance().play('dash');

    setTimeout(() => {
      this.container.classList.remove('dashing');
      this.container.style.transition = 'none';
      this.container.classList.remove('flapping');
      this.pos.x = landX;
      this.pos.y = -150; // Higher re-entry
      this.rotZ = 0;
      this.rotY = isFacingRight ? 180 : 0; // Turn back
      this.apply();

      requestAnimationFrame(() => {
        this.container.classList.add('flapping');
        this.container.style.transition =
          'top 1.0s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        this.pos.y = landY;
        this.apply();

        setTimeout(() => {
          this.container.classList.remove('flapping');
          this.container.style.transition = 'none';
          this.startIdle();
        }, 1000);
      });
    }, 1000); // More deliberate pause before re-entry
  }
}
