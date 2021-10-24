import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'axios';
import axios from 'axios';
import prettyBytes from 'pretty-bytes';
import setupEditor from './setupEditor';

const form = document.querySelector('[data-form]');
const queryParamsContainer = document.querySelector('[data-query-params]');
const requestHeadersContainer = document.querySelector(
    '[data-request-headers]'
);

const keyValueTemplate = document.querySelector('[data-key-value-template]');
const responseHeadersContainer = document.querySelector(
    '[data-response-headers]'
);

document
    .querySelector('[data-add-query-param-btn]')
    .addEventListener('click', (e) => {
        queryParamsContainer.append(createKeyValuePair());
    });

document
    .querySelector('[data-add-request-header-btn]')
    .addEventListener('click', (e) => {
        requestHeadersContainer.append(createKeyValuePair());
    });

queryParamsContainer.append(createKeyValuePair());
requestHeadersContainer.append(createKeyValuePair());

axios.interceptors.request.use((request) => {
    request.customData = request.customData || {};
    request.customData.startTime = new Date().getTime();
    return request;
});

function updateEndTime(response) {
    response.customData = response.customData || {};

    response.customData.time =
        new Date().getTime() - response.config.customData.startTime;
    return response;
}

axios.interceptors.response.use(updateEndTime, (e) => {
    return Promise.reject(updateEndTime(e.response));
});

const { requestEditor, updateResponseEditor } = setupEditor();

form.addEventListener('submit', (e) => {
    e.preventDefault();

    let data;
    try {
        data = JSON.parse(requestEditor.state.doc.toString() || null);
    } catch (error) {
        alert('JSON data is malformed');
        return;
    }
    axios({
        url: document.querySelector('[data-url]').value,
        method: document.querySelector('[data-method]').value,
        params: keyValuePairsToObjects(queryParamsContainer),
        headers: keyValuePairsToObjects(requestHeadersContainer),
        data,
    })
        .catch((e) => {
            return e;
        })
        .then((response) => {
            document
                .querySelector('[data-response-section]')
                .classList.remove('d-none');

            updateResponseDetails(response);
            updateResponseEditor(response);
            updateResponseHeaders(response.headers);
            console.log(response);
        });
});

function updateResponseHeaders(headers) {
    responseHeadersContainer.innerHTML = '';
    Object.entries(headers).forEach(([key, value]) => {
        const keyElement = document.createElement('div');
        keyElement.textContent = key;
        responseHeadersContainer.append(keyElement);

        const valueElement = document.createElement('div');
        valueElement.textContent = value;
        responseHeadersContainer.append(valueElement);
    });
}

function updateResponseDetails(response) {
    document.querySelector('[data-status]').textContent = response.status;
    document.querySelector('[data-size]').textContent = prettyBytes(
        JSON.stringify(response.data).length +
            JSON.stringify(response.headers).length
    );
    document.querySelector('[data-time]').textContent =
        response.customData.time;
}

function createKeyValuePair() {
    const element = keyValueTemplate.content.cloneNode(true);
    element
        .querySelector('[data-remove-btn]')
        .addEventListener('click', (e) => {
            e.target.closest('[data-key-value-pair]').remove();
        });

    return element;
}

function keyValuePairsToObjects(container) {
    const pairs = container.querySelectorAll('[data-key-value-pair]');

    return [...pairs].reduce((data, pair) => {
        const key = pair.querySelector('[data-key]').value;
        const value = pair.querySelector('[data-value]').value;

        if (key === '') return data;
        return { ...data, [key]: value };
    }, {});
}
