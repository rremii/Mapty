'use strict'

// prettier-ignore

const form = document.querySelector('.form')
const containerWorkouts = document.querySelector('.workouts')
const inputType = document.querySelector('.form__input--type')
const inputDistance = document.querySelector('.form__input--distance')
const inputDuration = document.querySelector('.form__input--duration')
const inputCadence = document.querySelector('.form__input--cadence')
const inputElevation = document.querySelector('.form__input--elevation')

class Workout {
    date = new Date()
    id = (Date.now() + '').slice(-10)
    constructor(coords, distance, duration) {
        this.coords = coords
        this.distance = distance //in km
        this.duration = duration //in min
    }
    _setDescription() {
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ]
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(
            1
        )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }
}

class Running extends Workout {
    type = 'running'
    constructor(coords, distance, duration, cadens) {
        super(coords, distance, duration)
        this.cadens = cadens
        this.calcPace()
        this._setDescription()
    }
    calcPace() {
        this.pace = this.duration / this.distance
        return this.pace
    }
}
class Cycling extends Workout {
    type = 'cycling'

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration)
        this.elevationGain = elevationGain
        this.calcSpeed()
        this._setDescription()
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60)
        return this.speed
    }
}
// let run1 = new Running([21, -52], 6, 30, 200)
// let sycl1 = new Cycling([21, -52], 5, 15, 500)
// console.log(run1)
// console.log(sycl1)

class App {
    #map
    #mapEvent
    #workouts = []
    #mapZoomLvl = 13
    constructor() {
        this._getPosition()
        this._getLocalStorage()

        form.addEventListener('submit', this._newWorkOut.bind(this))

        inputType.addEventListener('change', this._toggleElevationField)

        containerWorkouts.addEventListener(
            'click',
            this._moveTopopup.bind(this)
        )
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                () => {
                    alert = 'could not get current position'
                }
            )
        }
    }

    _loadMap(position) {
        let latitude = position.coords.latitude
        let longitude = position.coords.longitude
        const coords = [latitude, longitude]

        this.#map = L.map('map').setView(coords, this.#mapZoomLvl)
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map)

        this.#map.on('click', this._showForm.bind(this))
        this.#workouts.forEach((work) => {
            this._renderWorkoutMarker(work)
        })
    }

    _showForm(mapE) {
        this.#mapEvent = mapE
        form.classList.remove('hidden')
        inputDistance.focus()
    }
    _hideForm() {
        inputCadence.value =
            inputDistance.value =
            inputDuration.value =
            inputElevation.value =
                ''
        form.style.display = 'none'
        form.classList.add('hidden')
        setTimeout(() => (form.style.display = 'grid'), 1000)
    }

    _toggleElevationField() {
        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkOut(e) {
        const validInputs = (...inputs) => {
            return inputs.every((inp) => Number.isFinite(inp))
        }
        const allPositive = (...inputs) => {
            return inputs.every((inp) => inp > 0)
        }
        e.preventDefault()

        let type = inputType.value
        let distance = +inputDistance.value
        let duraction = +inputDuration.value
        let { lat, lng } = this.#mapEvent.latlng
        let workout

        if (type === 'running') {
            let cadence = +inputCadence.value
            if (
                !validInputs(distance, duraction, cadence) ||
                !allPositive(distance, duraction, cadence)
            ) {
                return alert('inputs have to be positive numbers')
            }
            workout = new Running([lat, lng], distance, duraction, cadence)
        }
        if (type === 'cycling') {
            let elevation = +inputElevation.value
            if (
                !validInputs(distance, duraction, elevation) ||
                !allPositive(distance, duraction)
            ) {
                return alert('inputs have to be positive numbers')
            }
            workout = new Cycling([lat, lng], distance, duraction, elevation)
        }
        this.#workouts.push(workout)
        this._renderWorkoutMarker(workout)
        this._renderWorkout(workout)

        this._hideForm()
        this._setLocalStorage()
    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(
                `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
                    workout.description
                }`
            )
            .openPopup()
    }
    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
                workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min/km</span>
          </div>
        `
        if (workout.type === 'running') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadens}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
            `
        }
        if (workout.type === 'cycling') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> -->
            `
        }
        form.insertAdjacentHTML('afterend', html)
    }
    _moveTopopup(e) {
        const workoutEl = e.target.closest('.workout')
        if (!workoutEl) return
        const workout = this.#workouts.find(
            (el) => el.id === workoutEl.dataset.id
        )
        console.log(workout)
        this.#map.setView(workout.coords, this.#mapZoomLvl, {
            animate: true,
            pan: {
                duration: 1,
            },
        })
    }
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'))
        if (!data) return
        this.#workouts = data
        this.#workouts.forEach((work) => this._renderWorkout(work))
    }
}

const app = new App()
