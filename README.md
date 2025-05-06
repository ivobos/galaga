# galaga

# prompts

create an npm project, that builds a web page, i want it to use typescript, and it will create a page that says hello world, i should be able to develop it with npm dev, and build it and then commit built code, and then use it in github pages

why is the dist ignored in .gitingore?

the docs should not be ,gitignored

 doesnt run in github, because the /assets/index-RkaUjwIM.js is not found
i think it should be a relative path?

ok, now modify that to create a game galaga
black background, ship at bottom, arrow keys to move, spaceto shoot
add aliens flying formations
just straight to gameplay, no intro screen

now make the player more of a spaceship shape, so like a triangle, with a cabit, little like jet fighter

now the aliens should look like aliens, with green red and colourful

can you make them drop bombs

if a bullet or alien hits the player, the p;auyer explodes

player should not die when his own butllets hits him

the aliens should arrive from off screen at the start

the player should be mostly white, with bit of red and blue

the player should be mostly white, with bit of red and blue

the player should be mostly white, with bit of red and blue

the aliens should fly in more swooping motions, so rather than changing directions suddenly they should swoop

so either the aliens move in a coordinated motion slowly, and go into a swooping mode where they fly towards the bottom and swoop and then return back to coordinated locaiton

is it possible for aliens to not crash into each other

ok, when they are on screen they just sit there, should they not moved?

thye are not moving once in formnation

does this
 if (!alien.isEntering) return;
mean that when alien has finished entereing, they will no longer move

when in formation, again its not moving at all

i think because of this:

the aliens dont move (i included link to code), can you use better states, so there should eb a single state variable which determines whtereh the aliens ins off screen, entering, formation or attacking

when it's game over, and player presses space, when everything is reset

make it so that game over stays for at least 3 seconds before pressing spac ewill start game again

can there be gun shooting noises

i cant hear the audop

ok crete sound effects for explosionts
also in general make sound effects less loud

when player explodes, make that a long lasting sound and a sad music

make sound when aliens drop bombs, the dropping sound sjhould be long but tnot that loud

the bomb dropping sounds needs to be short, also less loud, and only when alien drops a bomb

ok now have a score on the top left, and a hign score top middle , it should be red text saying  high score and the high score below it, scores should be white

top right show level
after all aliens are dead, a next level starts meaning aliens start spawmning again

the first level should have max of 10 aliens, then with each level more aliens will come

for each level add 1000 points

make bombs drop slightly sideways in direction the alien was travelling

make it less sideways, its too fast

add a bit of moving stars background, different colors but a bit dull, moving down

make stars move a bit faster

make stars a bit more colorful

before game starts, dont show aliens or player, just text saying. press space to start, at this phase the stars should not be movig down, but instead strobing

alients should. be one of 3 types, and first type is there already, 2nd type should be red wings, and white/blue body, and 3rd type should be blue with some red dots

the red wigs should be more like butterfly wings

the blue alien should have wings that are very long and downward., jhave have two brighter eyes

blue wings shouldm not be that long
also red wings should be bigger, and there should be tow eyes like a bug

the blue alien should be swooping at a faster rate
the red winged alien should be faster going sideways

the blue alien shold be rare, say 10%, red alien 40%

yellow alien has yellowish bombs,
bliue alien more like cyan
red aline more reddish

err, the bombs are still red

the blue alien should drop two at a time going in different directions, also can drop more frequently

have the sfx less loud
also play epic music during title

maybe remove the music

when the game is over, no more sound

make blue alien more purple
it should also drop many more bombs
make it do a humming sound as it turns

the purple alien should move a bit slower, but then drop 2 bombs and repeat its drop many times, say 8 times within quick order

each different alien should have a different hover sound

the hover sounds should be more like buzzing
also player should have more shots on screen

can the aliens follow each other when they swoop?

main.ts:761 Uncaught TypeError: Cannot read properties of undefined (reading 'x')
    at main.ts:761:56
    at Array.forEach (<anonymous>)
    at Game.update (main.ts:617:21)
    at Game.gameLoop (main.ts:1342:14)
    at main.ts:1344:42

when they are swooping, they should fly lower

when they are swooping, they should fly lower

they shuld drop bombs more often

can you add a 4th alien type,it should be gree wings with yello eyes, it should come in as a snake as in members follow each other

when the green one comes out, make at least 20 of them, and they follow each other
also the sound of the gree one should be money

the green doesnt drop bombs, but instead swoops all the time, also it always comes from the same position

the gree ones dont seem to swoop

the green ones are not moving

make the green come out one at atime
also make it swoop a lot

ok, remove the green alien

can you add touch support, so while the user is touching the screen, the player should move horizontally towards where the touch point is and act as if the player was holding space, ie, shoot.
also change text to say that player should press space or touch screen to start

make the play are more mobile friendly format

it should move towards the touch point, not the click,

why is screen not taller on responsive device?

the height should be also responsive, up to a point

