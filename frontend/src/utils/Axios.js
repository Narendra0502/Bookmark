import axios from 'axios'


// const API_URL =  'http://localhost:5000/api';
const API_URL =  'https://bookmark-kkxc.onrender.com/api';
const Axios = axios.create({
    baseURL: API_URL,
    withCredentials: true
})

export default Axios;
