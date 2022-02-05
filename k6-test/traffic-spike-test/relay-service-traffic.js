import {sleep, check, fail} from 'k6';
import http from 'k6/http';


const baseUrl = "http://alb-delivery-relay-service-1071471430.ap-northeast-2.elb.amazonaws.com";
const shopPath = baseUrl + "/relay/v1/shop/";
const agencyPath = baseUrl + "/relay/v1/agency/";
const UNIT = 500; // should be 1000
const ratio = 0.4;
const MAX_TARGET = parseInt(100 * UNIT * 0.4);
const params = {
    headers: {
        'Content-Type': 'application/json',
    },
};


export let options = {
    stages: [
        {duration: '1m', target: MAX_TARGET}, // 0부터 맥스타겟까지 올라가기
        {duration: '20m', target: MAX_TARGET} // 그리고나서 계속 올라가기
    ],
    thresholds: {
        http_req_failed: ['rate<=0.05'],
        http_req_duration: ['p(90)<=1000', 'p(95)<=1250', 'p(100)<=1500'],
        checks: ['rate>=0.95']
    }
};

export function setup() {
    if (!isServerResponding()) {
        throw Error("is Server Responding? : NO");
    }
}


export default () => {
    // 신규주문
    const id = Date.now().toString();
    const payload = makeNewDelivery(id, 'NEW');
    payload;

    const shopRelay = http.post(shopPath + id, JSON.stringify(payload), params);
    const shopRelayErrorInfo = 'Shop Relay Result >>> ';
    check(shopRelay, {
        'shopRelay is OK 200': () => logIfNotOK200AndReturn(shopRelay, shopRelayErrorInfo)
    });
    sleep(0.5);

    const agencyRelay = http.post(agencyPath + id, JSON.stringify(payload), params);
    const agencyRelayErrorInfo = 'Agency Relay Result >>> ';
    check(agencyRelay, {
        'agencyRelay is OK 200': () => logIfNotOK200AndReturn(agencyRelay, agencyRelayErrorInfo)
    });
    sleep(0.5);
};


function logIfNotOK200AndReturn(response, completeErrorResponse) {
    if (response.status !== 200) {
        console.info(completeErrorResponse + response.body);
    }
    return response.status === 200;
}


function isServerResponding() {
    let canRun = false;
    for (let i = 0; i < 3; i++) {
        const addDelivery = http.get(baseUrl);
        console.info(addDelivery.body);
        if (addDelivery.status === 200) {
            canRun = true;
            break;
        }
        sleep(1);
    }
    if (canRun !== true) {
        fail("not responding host");
    }
    return canRun;
}


function makeNewDelivery(id, status) {
    let ISOString = new Date().toISOString();
    ISOString = ISOString.replace('Z', 111);
    return {
        'id': id,
        'orderId': 'orderId-' + id,
        'agencyId': 'agencyId-' + id,
        'shopId': 'shopId-' + id,
        'customerId': 'customerId-' + id,
        'address': 'address-' + id,
        'phoneNumber': 'phoneNumber-' + id,
        'comment': 'comment-' + id,
        'deliveryStatus': status === null ? 'NEW' : status,
        'orderTime': ISOString,
        'pickupTime': ISOString,
        'finishTime': ISOString
    };
}
