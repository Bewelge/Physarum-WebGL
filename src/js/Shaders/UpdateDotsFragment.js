export const UPDATE_DOTS_FRAGMENT = `
    uniform vec2 resolution; 
			
    uniform float mouseRad;
    uniform float time;
    uniform vec2 mousePos;
        
    uniform bool isDisplacement;
    uniform vec3 moveSpeed;
    uniform vec3 rotationAngle;
    uniform vec3 sensorDistance;
    uniform vec3 sensorAngle; 
    uniform vec3 infectious; 
    
    uniform vec3 attract0; 
    uniform vec3 attract1; 
    uniform vec3 attract2; 
    
    uniform vec2 textureDimensions;

    uniform sampler2D diffuseTexture;
    uniform sampler2D mouseSpawnTexture;
    uniform sampler2D pointsTexture;

    //the positions & directions as rg & b values
    uniform sampler2D input_texture;

    varying vec2 vUv;


    const float PI  = 3.14159265358979323846264; 
    const float PI2 = PI * 2.;


    float sampleDiffuseTexture(vec2 pos, float team) {
        float val = 0.;
        const float searchArea = 1.;
        vec2 uv = pos / resolution + 0.5;
        for (float i = 0.;i<searchArea * 2. + 1.;i++) {
            for (float j = 0.;j<searchArea * 2. + 1.;j++) {
                vec4 pixel = texture2D(diffuseTexture,(uv + vec2(i - searchArea,j - searchArea) / resolution)).rgba;
                vec3 attract = attract0;
                if (team == 1.) {
                    attract = attract1;
                } else if (team == 2. ) {
                    attract = attract2;
                }
                float pixelVal = pixel.r  * attract.r + pixel.g * attract.g + pixel.b * attract.b;
                val += pixelVal * (1. / pow(2. * searchArea + 1.,2.));
            }    
        }
        return val; 
    }

    float getDataValue(vec2 uv){
        vec3 pixel = texture2D(pointsTexture,( uv / resolution  + 0.5) ).rgb;
        return pixel.r + pixel.b + pixel.g;
        
    }
    
    float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec2 wrapPos(vec2 pos) {
        return fract( (pos.xy + resolution * 0.5) /resolution ) * resolution - resolution * 0.5;
    }

    //attempt to get it working in webgl1. No errors using this but still doesn't work.
    //float getTeamValue(float team,vec3 data) {
    //    if (team == 0.) {
    //        return data.x;
    //    } else if (team == 1.) {
    //        return data.y;
    //    } else if (team == 2.) {
    //        return data.z;
    //    }
    //}
     

    void main()	{

        vec2 uv = gl_FragCoord.xy / textureDimensions;
        vec4 tmpPos = texture2D( input_texture, gl_FragCoord.xy / textureDimensions );
        
        vec4 mouseSpawnPixel = texture2D(mouseSpawnTexture,gl_FragCoord.xy / textureDimensions);
        if (mouseSpawnPixel.r != 0. || mouseSpawnPixel.g != 0. || mouseSpawnPixel.b != 0. || mouseSpawnPixel.a != 0.) {
            gl_FragColor = mouseSpawnPixel;
            return;
        }
        
        vec2 position = tmpPos.xy ;
        float direction = tmpPos.z;
        float team = tmpPos.a;  
        int teamInt = int(team);
    
        float angDif = sensorAngle[teamInt];
        float leftAng = direction - angDif;
        float rightAng = direction + angDif;

        float sensorDist = sensorDistance[teamInt];
        vec2 leftPos = 	position + vec2( cos(leftAng) , 	sin(leftAng	))  * sensorDist;
        vec2 midPos =	position + vec2( cos(direction) , 	sin(direction)) * sensorDist;
        vec2 rightPos = position + vec2( cos(rightAng) , 	sin(rightAng)) 	* sensorDist;

        
        float leftVal = sampleDiffuseTexture(leftPos.xy ,team);
        float rightVal = sampleDiffuseTexture(rightPos.xy,team);
        float midVal = sampleDiffuseTexture(midPos.xy,team);
        
            
            


        float rotationAng = rotationAngle[teamInt];

        
        
            
        	if(midVal > rightVal && midVal > leftVal) {
        	} else if (midVal < rightVal && midVal < leftVal) {
        		direction += (0.5 - floor(rand(position + gl_FragCoord.xy) + 0.5)) * rotationAng;
        	} else if (rightVal > midVal && rightVal > leftVal) {
        		direction += rotationAng; 
        	} else if (leftVal > midVal && leftVal > rightVal) {
        		direction -= rotationAng; 
        	}
        
        //this is the above without if/else branching (on further inspection: It's not.)
        // float goStraight = sign(max(0., midVal - leftVal) * max(0.,midVal - rightVal));
        // float goRandom =   sign(max(0., rightVal - midVal) * max(0.,leftVal - midVal));
        // float goRight =    sign(max(0., rightVal - midVal) * max(0.,rightVal - leftVal));
        // float goLeft =     sign(max(0.,  leftVal - midVal) * max(0., leftVal - rightVal));

        // direction += (1. - goStraight) *  (
        //     (0.5 - floor(rand(position) + 0.5)) * goRandom * rotationAng +
        //         (rotationAng * goRight - rotationAng * goLeft) * (1. - goRandom)
        // );
            
        
        
        vec2 newPosition = position  + vec2(cos(direction),sin(direction)) *  moveSpeed[teamInt];



        //stop if new field is already occupied
        if( isDisplacement && getDataValue(newPosition.xy) > 0. ){
            newPosition.xy = tmpPos.xy;
            direction += PI2 / 2.;
        }
    
        //push particles away from mouse
        vec2 seg = newPosition.xy - mousePos;
        vec2 dir = normalize(seg);
        float dist = length(seg);
        if (dist< mouseRad) { 
            newPosition.xy +=3. *  dir * (50. + mouseRad -  dist) / (50. + mouseRad /  5.); 
        } 
    

        //if (newPosition.x < -resolution.x * 0.5 || newPosition.x > resolution.x * 0.5 || newPosition.y < -0.5 * resolution.y || newPosition.y > resolution.y* 0.5) {
        //if (length(newPosition) > 250. ) {
        //	newPosition.xy = tmpPos.xy;
        //	direction += PI * sign(rand(position.xy)-0.5);
        //}
        
        //wrap coordinates on screen
        newPosition.xy = wrapPos(newPosition.xy);
    


        vec4 newPixelColor =texture2D(diffuseTexture, tmpPos.xy / resolution + 0.5);
        bool isBlue = newPixelColor.b > 0.5 && newPixelColor.b > newPixelColor.r && newPixelColor.b > newPixelColor.g;
        bool isRed = newPixelColor.r > 0.5 && newPixelColor.r > newPixelColor.b && newPixelColor.r > newPixelColor.g;
        bool isGreen = newPixelColor.g > 0.5 && newPixelColor.g > newPixelColor.b && newPixelColor.g > newPixelColor.r;
        //Blue infects red 
        if (isBlue && team == 0. && infectious.b > 0.) {
            team = 2.;
        } else 
        //red infects green
        if (isRed && team == 1. && infectious.r > 0.) {
            team = 0.;
        } else 
        //green infects blue
        if (isGreen && team == 2. && infectious.g > 0.) {
            team = 1.;
        }
            
    
        gl_FragColor = vec4( newPosition.xy  , direction,  team );

    }`
