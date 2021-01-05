import fs from 'fs';
import AudioPlayer from 'play-sound'

enum SoundScene {
    StartGame = 'startGame'
};

class SoundGenerator {
    private readonly _path: string;
    private readonly _audioPlayer: AudioPlayer;

    constructor(path: string) {
        this._path = path;
        this._audioPlayer = AudioPlayer({player: 'mpg123'});
    }

    public playSound(soundScene: SoundScene) {
        this._audioPlayer.play(this.getFilePath(soundScene), (err) => {
            if (err) {
                console.log('Sound Error: ' + err);
            }
        });
    }

    private getFilePath(soundScene: SoundScene): string {
        const pathToScenes: string = this._path + soundScene;
        const sceneFiles: string[] = fs.readdirSync(pathToScenes);
        const randomFile: string = sceneFiles[Math.floor(Math.random() * sceneFiles.length)];

        return pathToScenes + '/' + randomFile;
    }
};

export default SoundGenerator;
export {
    SoundScene
};