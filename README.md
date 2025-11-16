Nasreen Mohamedi: Perlin Noise-Driven Organic Structure Animation

(Individual Task: Perlin Noise and Randomness)

1. How to Run This Work

This prototype is a self-driven system—you don't need to interact with it for the animation to run.

Just load the index.html file, and the composition will begin to build itself.

The animation proceeds in two phases:

Initial Drawing Phase: The image is drawn sequentially, line by line, mimicking the precise, deliberate process of the artist's drafting.

Sustained Animation Phase: Once the image is complete, it enters a continuous, organic state. The small line segments will subtly contract and expand, and the thick "erasure" lines will begin to move slowly across the central canvas area.

If you need to adjust your browser window, the entire composition will automatically reset and scale to fit the new dimensions.

2. My Approach and How It's Different

I chose the Perlin Noise method because I wanted to take Mohamedi's incredibly precise, static grid and infuse it with an organic, subtle sense of life, as if the drawing itself is subtly breathing.

A. The Method: Perlin Noise and Randomness

I used both Perlin noise and traditional random functions to drive the animation.

B. Unique Animated Properties

To ensure my work is visually distinct, I focused on animating three separate properties within the composition:

Line Length Pulsation (The Core Innovation)
My biggest focus was making the small line segments (Layer 1, 3, 5) pulsate—they continuously and smoothly expand and contract along their axis. The key innovation here is the Subgroup mechanism. Instead of having all lines expand in unison (which looks cheap and digital), I randomly assigned 1 to 3 "subgroups" within each line cluster, and each subgroup is driven by its own independent noise seed. This creates a complex, localized desynchronization, giving the overall effect of a detailed, hand-drawn jitter rather than a simple wave.

Erasure Line Dynamics
The thick, background-colored "erasure" lines (Layer 2, 4) serve two functions:

Weight Fluctuation: The stroke weight of these lines constantly fluctuates, driven by another layer of Perlin noise. This is meant to simulate the irregularities of the material, like uneven pressure from an erasing tool or variations in ink density.

Positional Movement: These lines are also programmed to move slowly and linearly back and forth. This persistent, gentle shift creates a disruption that reminds the viewer of the passage of time over the structure.

3. Inspiration and Rationale

The artistic impulse here was transforming Mohamedi's static, precise grid structure into a dynamic system driven by an internal energy. I chose Perlin noise specifically because it provides that fluid, natural sense of randomness, which is far better suited than the choppy, unpredictable output of a standard random() function. The movement needed to feel continuous and organic.

The implementation of the Subgroup logic was necessary to solve a technical problem: how to avoid synchronized, global movement. By introducing spatial randomness, I ensured that individual line segments fluctuate at different rates, adding a layer of organic complexity that makes the composition feel genuinely volatile.

4. Technical Overview and External References

A. Core Perlin Noise Implementation

The entire animation is timed by a global variable, noiseZSeed, which serves as a Z-axis timeline in the noise space. I increment this variable by a tiny amount (0.005) every frame in the draw() loop, which is what keeps the animation smoothly evolving.

In the code, when calculating the line's final length, the noise value is computed using noise(noiseZSeed + subgroup.noiseZ). The spatial seed (subgroup.noiseZ) ensures each subgroup's rhythm is unique. I also took care to make sure the calculated length perturbation is applied equally and inversely to the line's endpoint, which keeps the line's geometric center stable while its length changes.

B. External Tools and Techniques

I used a couple of techniques not explicitly covered in our lectures, and I made sure to document them:

HSB Color Mode: I used colorMode(HSB, 360, 100, 100, 255); in setup(). This wasn't strictly necessary, but HSB mode allowed me to perfectly match the background color for my erasure lines, which made the "erasing" effect look much cleaner and more seamless.

Reference: // This technique uses HSB color mode for precise control over the erasure line color. Reference: [https://p5js.org/reference/#/p5/colorMode]

Perlin Noise Theory: The concept of using the Z-axis as a time driver for smooth, continuous motion is fundamental to this piece.

Reference: // Perlin Noise is used to generate smooth, natural-looking randomness for length and weight fluctuations. The Z-axis is used as a time driver. Reference: The Coding Train - Perlin Noise in Two Dimensions: [https://www.youtube.com/watch?v=ikwNrFvnL3g]