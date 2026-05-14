const perspective = window.PerspT;

let sketch = function(p) {
  let THE_SEED;
  let number_of_particles = window.matchMedia("(max-width: 640px)").matches ? 1200 : 3000;
  let number_of_particle_sets = 10;
  let particle_sets = [];
  let tick = 0;
  let pTransform;

  p.setup = function() {
    p.createCanvas(1600, 1200);
    THE_SEED = p.floor(p.random(9999999));
    p.randomSeed(THE_SEED);
    p.noiseSeed(THE_SEED);

    p.noFill();
    p.clear();
    p.stroke(22, 55, 40, 18);
    p.strokeWeight(0.7);
    p.smooth();

    var srcCorners = [0, 0, p.width, 0, p.width, p.height, 0, p.height];
    var dstCorners = [180, 260, p.width - 120, 260, p.width + 300, p.height - 250, -300, p.height - 250];
    pTransform = perspective(srcCorners, dstCorners);

    for (var j = 0; j < number_of_particle_sets; j++) {
      let ps = [];
      for (var i = 0; i < number_of_particles; i++) {
        ps.push(
          new Particle(p.randomGaussian(p.width * 0.46, 210), p.randomGaussian(p.height / 2, 185), p.random(p.TWO_PI))
        );
      }
      particle_sets.push(ps);
    }
  };

  p.draw = function() {
    particle_sets.forEach(function(particles, index) {
      particles.forEach(function(particle) {
        particle.update(index);
        particle.display(index);
      });
    });

    tick++;
    if (tick > 220) p.noLoop();
  };

  class Particle {
    constructor(x, y, phi) {
      this.pos = p.createVector(x, y);
      this.angle = phi;
      this.val = 0;
    }

    update(index) {
      this.pos.x += p.cos(this.angle);
      this.pos.y += p.sin(this.angle);

      let nx = 2.05 * p.map(this.pos.x, 0, p.width, -1, 1);
      let ny = 1.9 * p.map(this.pos.y, 0, p.height, -1, 1);

      let n = p.createVector(nx, ny);

      this.altitude = p.noise(n.x + 423.2, n.y - 231.1) + 0.05 * p.noise(n.x * 15 + 113.3, n.y * 15 + 221.1);
      let nval = (this.altitude + 0.045 * (index - number_of_particle_sets / 2)) % 1;

      this.angle += 3 * p.map(nval, 0, 1, -1, 1);
      this.val = nval;
    }

    display(index) {
      if (this.val > 0.476 && this.val < 0.524) {
        let np = pTransform.transform(this.pos.x, this.pos.y + 170 - this.altitude * 430);
        p.point(np[0], np[1]);
      }
    }
  }
};

new p5(sketch, 'sketch');
