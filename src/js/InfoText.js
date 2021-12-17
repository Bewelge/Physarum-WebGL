export const INFO_TEXT = `This is a simulation of the <a href="https://en.wikipedia.org/wiki/Physarum_polycephalum">Physarum polycephalum</a>, a slime mold that, even though it’s missing a nervous system, 
exhibits quite interesting, seemingly intelligent behaviour. There have been a number of attempts to make up a set of rules that govern these organisms that would explain this behaviour. 
This simulation is based on the implementation presented in <a href="https://uwe-repository.worktribe.com/output/980579">this paper</a>. </br></br>
The single slime cells are simulated as particles. Every frame, each particle samples three positions in front of it (front, font-left & front-right) and depending on the colour value in each sample it will move (straight, straight-left, or straight-right respectively). There’s also a chance a particle will move in a random direction. Each particle will also leave a trail which diffuses and decays over time. This trail is what is being sampled by each particle. The implementation supports up to 3 different species, that can infect each other.
</br>
</br>
Controls
Use the controls on the right to adjust the settings. You can control the distance and angle for both movement and sampling for each color individually. You can also adjust the attraction of the colors to each other.
Click to spawn more particles. Move mouse to push particles around.
</br>
</br>
The simulation is implemented in Javascript & WebGL using Three.js. </br></br>
Many thanks to </br>
<a href="https://github.com/nicoptere/physarum">https://github.com/nicoptere/physarum</a> - Helped me a lot to figure out how to implement this. 
</br></br></br>
<a href="https://github.com/Bewelge/Physarum-WebGL">Github Repository</a>


`
