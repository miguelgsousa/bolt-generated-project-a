export class CircleSimulation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number = 0;
  private running: boolean = false;
  private startTime: number = 0;
  private elapsedTime: number = 0;

  // Constants
  private readonly WIDTH: number;
  private readonly HEIGHT: number;
  private readonly INITIAL_BALL_RADIUS = 5;
  private readonly CIRCLE_RADIUS: number;
  private GRAVITY = 0.4;
  private VELOCITY_INCREASE_FACTOR = 1.02;
  private VELOCITY_INCREASE_FACTOR2 = 1.03;
  private VELOCITY_DECAY = 0.998;
  private BALL_GROWTH_RATE = 1.015;
  private readonly MAX_BALL_RADIUS: number;
  private readonly MOTION_BLUR_STEPS = 5;
  private previousPositions: Array<[number, number]> = [];
  private readonly BASE_MASS = 1;

  // Ball properties
  private ballRadius: number;
  private ballCenter: [number, number];
  private ballVelocity: [number, number];
  private colorPhase: number = 0;
  private readonly COLOR_PHASE_SPEED = 0.05;

  // Collision points
  private collisionPoints: Array<[number, number]> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;

    this.WIDTH = canvas.width;
    this.HEIGHT = canvas.height;
    this.CIRCLE_RADIUS = Math.min(this.WIDTH, this.HEIGHT) / 2 - 125;
    this.MAX_BALL_RADIUS = this.CIRCLE_RADIUS - 10;

    this.reset();
  }

  private calculateMass(): number {
    // Reduce mass influence by using square root instead of square
    return this.BASE_MASS * Math.sqrt(this.ballRadius / this.INITIAL_BALL_RADIUS);
  }

  public reset() {
    this.ballRadius = this.INITIAL_BALL_RADIUS;
    this.ballCenter = [this.WIDTH / 2, this.HEIGHT / 2.7];
    this.ballVelocity = [0.8, 0.8];
    this.collisionPoints = [];
    this.previousPositions = [];
    this.startTime = performance.now();
    this.elapsedTime = 0;
  }

  public setGravity(value: number) {
    this.GRAVITY = value;
  }

  public setVelocityIncrease(value: number) {
    this.VELOCITY_INCREASE_FACTOR = 1 + value;
    this.VELOCITY_INCREASE_FACTOR2 = 1 + value + 0.01;
  }

  public setVelocityDecay(value: number) {
    this.VELOCITY_DECAY = value;
  }

  public setBallGrowthRate(value: number) {
    this.BALL_GROWTH_RATE = 1 + value;
  }

  private transitionColor(): string {
    const r = Math.floor(127 * Math.sin(this.colorPhase) + 128);
    const g = Math.floor(127 * Math.sin(this.colorPhase + 2) + 128);
    const b = Math.floor(127 * Math.sin(this.colorPhase + 4) + 128);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private update() {
    this.elapsedTime = (performance.now() - this.startTime) / 1000;

    this.previousPositions.push([...this.ballCenter]);
    if (this.previousPositions.length > this.MOTION_BLUR_STEPS) {
      this.previousPositions.shift();
    }

    // Calculate mass-based physics with reduced influence
    const mass = this.calculateMass();
    const effectiveGravity = this.GRAVITY * (1 + (mass - 1) * 0.2); // Reduced mass influence on gravity
    const massBasedDecay = Math.max(this.VELOCITY_DECAY - (mass - 1) * 0.00005, 0.997); // Reduced decay influence

    // Apply gravity with lighter mass influence
    this.ballVelocity[1] += effectiveGravity;

    // Apply velocity decay based on mass
    this.ballVelocity[0] *= massBasedDecay;
    this.ballVelocity[1] *= massBasedDecay;

    // Update ball position
    this.ballCenter[0] += this.ballVelocity[0];
    this.ballCenter[1] += this.ballVelocity[1];

    // Check for collision with circle
    const circleCenter: [number, number] = [this.WIDTH / 2, this.HEIGHT / 2];
    const dx = this.ballCenter[0] - circleCenter[0];
    const dy = this.ballCenter[1] - circleCenter[1];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= this.CIRCLE_RADIUS - this.ballRadius) {
      // Calculate normal vector
      const nx = dx / distance;
      const ny = dy / distance;

      // Calculate reflection with lighter mass influence
      const dot = this.ballVelocity[0] * nx + this.ballVelocity[1] * ny;
      const restitution = Math.max(0.9 - (mass - 1) * 0.005, 0.7); // Higher minimum restitution
      
      this.ballVelocity[0] = (this.ballVelocity[0] - 2 * dot * nx) * restitution;
      this.ballVelocity[1] = (this.ballVelocity[1] - 2 * dot * ny) * restitution;

      // Increase ball size with limit
      if (this.ballRadius < this.MAX_BALL_RADIUS) {
        this.ballRadius = Math.min(
          this.ballRadius * this.BALL_GROWTH_RATE,
          this.MAX_BALL_RADIUS
        );
      }

      // Velocity increase with lighter mass influence
      const massBasedIncrease = 1 + (this.VELOCITY_INCREASE_FACTOR - 1) / Math.pow(mass, 0.3);
      this.ballVelocity[0] *= massBasedIncrease;
      this.ballVelocity[1] *= massBasedIncrease;

      // Add minimum velocity to prevent stopping, with lighter mass scaling
      const minVelocity = 1.0 / Math.pow(mass, 0.25); // Reduced mass influence on minimum velocity
      const currentVelocity = Math.sqrt(this.ballVelocity[0]**2 + this.ballVelocity[1]**2);
      if (currentVelocity < minVelocity) {
        const scale = minVelocity / currentVelocity;
        this.ballVelocity[0] *= scale;
        this.ballVelocity[1] *= scale;
      }

      // Calculate collision point
      const angle = Math.atan2(dy, dx);
      const collisionX = circleCenter[0] + this.CIRCLE_RADIUS * Math.cos(angle);
      const collisionY = circleCenter[1] + this.CIRCLE_RADIUS * Math.sin(angle);
      this.collisionPoints.push([collisionX, collisionY]);

      // Adjust ball position to prevent sticking
      this.ballCenter[0] = circleCenter[0] + (this.CIRCLE_RADIUS - this.ballRadius) * Math.cos(angle);
      this.ballCenter[1] = circleCenter[1] + (this.CIRCLE_RADIUS - this.ballRadius) * Math.sin(angle);
    }

    this.colorPhase += this.COLOR_PHASE_SPEED;
  }

  private draw() {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    const circleCenter: [number, number] = [this.WIDTH / 2, this.HEIGHT / 2];

    // Draw main circle with RGB outline
    this.ctx.strokeStyle = this.transitionColor();
    this.ctx.lineWidth = 25;
    this.ctx.beginPath();
    this.ctx.arc(circleCenter[0], circleCenter[1], this.CIRCLE_RADIUS + 25, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw collision lines
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 2;
    for (const point of this.collisionPoints) {
      this.ctx.beginPath();
      this.ctx.moveTo(point[0], point[1]);
      this.ctx.lineTo(this.ballCenter[0], this.ballCenter[1]);
      this.ctx.stroke();
    }

    // Draw text "@singing.ball" at the center
    this.ctx.fillStyle = 'white';
    this.ctx.font = '30px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('@singing.ball', circleCenter[0], circleCenter[1]);

    // Draw timer and mass below the circle
    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      `Time: ${this.elapsedTime.toFixed(1)}s | Mass: ${this.calculateMass().toFixed(1)}`,
      circleCenter[0],
      circleCenter[1] + this.CIRCLE_RADIUS + 60
    );

    // Draw motion blur
    this.previousPositions.forEach((pos, index) => {
      const alpha = (index + 1) / this.MOTION_BLUR_STEPS;
      this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.2})`;
      this.ctx.beginPath();
      this.ctx.arc(pos[0], pos[1], this.ballRadius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw ball with solid fill
    this.ctx.fillStyle = '#ff0000';
    this.ctx.beginPath();
    this.ctx.arc(this.ballCenter[0], this.ballCenter[1], this.ballRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private animate = () => {
    if (!this.running) return;
    
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.animate);
  };

  public start() {
    if (!this.running) {
      this.startTime = performance.now() - (this.elapsedTime * 1000);
    }
    this.running = true;
    this.animate();
  }

  public stop() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
  }

  public isRunning() {
    return this.running;
  }
}
