let isRecording = false;
let recordedTune = [];
const synth = new Tone.Synth().toDestination();


// this is a key map for all of the notes
document.addEventListener('DOMContentLoaded', () => {
    const keyMappings = {
        'a': 'C4',
        'w': 'C#4',
        's': 'D4',
        'e': 'D#4',
        'd': 'E4',
        'f': 'F4',
        't': 'F#4',
        'g': 'G4',
        'y': 'G#4',
        'h': 'A4',
        'u': 'Bb4',
        'j': 'B4',
        'k': 'C5',
        'o': 'C#5',
        'l': 'D5',
        'p': 'D#5',
        ';': 'E5',
    };
    

    // makes sure teh note is played for the correct time
    const playNote = (note) => {
        if (Tone.context.state !== 'running') {
            Tone.context.resume();
        }
        synth.triggerAttackRelease(note, "8n");
        
        if (isRecording) {
            // makes sure the timing of the notes starts when the user presses record
            let noteTiming = Tone.now() - recordingStartTime;
            recordedTune.push({
                note: note,
                duration: "8n",
                timing: noteTiming
            });
        }
    };

    // event listener for keyboard press
    document.addEventListener('keydown', event => {

        // makes you able to write the name of the tune without hearing keys
        if (document.activeElement === document.getElementById('recordName')) {
            return;
        }
    
        if (!event.repeat) {
            const note = keyMappings[event.key.toLowerCase()]; 
            if (note) {
                playNote(note);
            }
        }
    });

    // event listener for click on button 
    document.querySelectorAll('.whitebtn, .blackbtn').forEach(button => {
        button.addEventListener('click', () => {
            const note = button.id;
            playNote(note);
            }
        )});

    // calls the fetch tunes func to get the items for the dropdown menu
    fetchTunes();

    // event listener for the play button for the dropdown menu items 
    document.getElementById('tunebtn').addEventListener('click', playSelectedTune);

    });


 async function fetchTunes() {
    const url = 'http://localhost:3000/api/v1/tunes';

    // sets up a try catch block to make sure the errors are handled correctly
    try {
        const response = await fetch(url);
        // this checks if the repseonse was not ok, if it wasnt, it throws an erro and stops
        if (!response.ok) {
            throw new Error('Network response error');
        }
        // we use response.json to automatically parse the date to a js format
        const tunes = await response.json();
        fillTunesDropdown(tunes);
    } catch (error) {
        console.error('fetch operation error:', error);
    }
}

//this fills the dropdown menu with the tunes
function fillTunesDropdown(tunes) {
    const select = document.getElementById('tunesDrop');

    // this clears any existing elements, to avoid duplicates and then fills it with the items
    select.innerHTML = '';
    tunes.forEach(tune => {
        let option = new Option(tune.name, tune.id);
        select.add(option);
    });
}

// this function plays the selected tune in the dropdown menu
async function playSelectedTune() {
    const selectedTuneId = document.getElementById('tunesDrop').value;
    try {

        // we need to fetch the tunes to work with them
        const response = await fetch('http://localhost:3000/api/v1/tunes');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const tunes = await response.json();

        // finds the tune with the selected ID from the fetched tunes
        const tune = tunes.find(t => t.id === selectedTuneId);
        if (!tune) {
            throw new Error('Tune not found');
        }

        playTune(tune.tune);
    } catch (error) {
        console.error('Error fetching tune:', error);
    }
}


function playTune(tuneArray) {
    Tone.Transport.stop();
    Tone.Transport.cancel();

    // sets the timing for each note in the tune array
    tuneArray.forEach(noteObj => {
        Tone.Transport.schedule(time => {
            synth.triggerAttackRelease(noteObj.note, noteObj.duration, time);
        }, noteObj.timing);
    });

    // starts the Transport to play the notes
    Tone.Transport.start();
}

function recordTune() {
    isRecording = true;

    // this clears the previous recording
    recordedTune = []; 

    // resets start time for new recording
    recordingStartTime = Tone.now(); 

    document.getElementById('stopbtn').disabled = false;
}


function stopRecording() {
    // stops the recording proccess
    isRecording = false;
    
    //this disables the stop button and sends the data to the saveTune func
    document.getElementById('stopbtn').disabled = true;
    saveTune();
}

// this saves the recorded tune
async function saveTune() {
    // takes the name from the name field in the recording, if it is empty it will be "New Tune"
    const tuneName = document.getElementById('recordName').value || 'New Tune';
    const url = 'http://localhost:3000/api/v1/tunes';
    
    try {
        // this sends a post request to the url, with all of the tune data
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: tuneName,
                tune: recordedTune
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        // after saving it will fetch the updated list of tunes
        fetchTunes();
    } catch (error) {
        console.error('error saving the tune:', error);
    }
}
