import {sleep, check, fail} from 'k6';
import http from 'k6/http';


const URI = "http://localhost.ap-northeast-2.compute.amazonaws.com:8888/api/delivery";
const UNIT = 1000;
const params = {
    headers: {
        'Content-Type': 'application/json',
    },
};


export let options = {
    stages: [
        {duration: '2m', target: 1 * UNIT},
        {duration: '2m', target: 1 * UNIT},
        {duration: '2m', target: 1 * UNIT},
        {duration: '2m', target: 3 * UNIT},
        {duration: '2m', target: 6 * UNIT},
        {duration: '2m', target: 35 * UNIT},
        {duration: '2m', target: 50 * UNIT},
        {duration: '2m', target: 20 * UNIT},
        {duration: '2m', target: 17 * UNIT},
        {duration: '2m', target: 15 * UNIT},
        {duration: '2m', target: 20 * UNIT},
        {duration: '2m', target: 60 * UNIT},
        {duration: '2m', target: 100 * UNIT},
        {duration: '2m', target: 80 * UNIT},
        {duration: '2m', target: 60 * UNIT},
        {duration: '2m', target: 45 * UNIT},
        {duration: '2m', target: 40 * UNIT},
        {duration: '2m', target: 30 * UNIT},
        {duration: '2m', target: 10 * UNIT},
        {duration: '2m', target: 10 * UNIT},
        {duration: '2m', target: 5 * UNIT},
        {duration: '2m', target: 1 * UNIT},
        {duration: '2m', target: 1 * UNIT},
        {duration: '2m', target: 1 * UNIT}
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
    const req_addDelivery = makeNewDelivery();
    req_addDelivery['riderId'] = null;

    const addDelivery = http.post(URI, JSON.stringify(req_addDelivery), params);
    const addDeliveryErrorInfo = 'addDelivery result >>> ';
    check(addDelivery, {
        'addDelivery is OK 200': () => logIfNotOK200AndReturn(addDelivery, addDeliveryErrorInfo)
    });
    sleep(1);


    // 신규주문 저장 실패시 에러
    if (addDelivery.status !== 200) {
        fail("Failed to addDeilvery");
    }

    if (addDelivery.body === null) {
        fail("response body not found");
    }
    const SAVED_DELIVERY = JSON.parse(addDelivery.body);
    const DELIVRY_ID = SAVED_DELIVERY.id;


    // 주문접수
    const req_acceptDelivery = makeDelivery(DELIVRY_ID, 'ACCEPTED');
    req_acceptDelivery['riderId'] = null;
    req_acceptDelivery['orderTime'] = new Date().toISOString();
    sleep(0.01);
    req_acceptDelivery['pickupTime'] = new Date().toISOString();

    const acceptDelivery = http.put(URI + "/accept", JSON.stringify(req_acceptDelivery), params);
    const acceptDeliveryErrorInfo = 'acceptDelivery result >>> ';
    check(acceptDelivery, {
        'acceptDelivery is OK 200': () => logIfNotOK200AndReturn(acceptDelivery, acceptDeliveryErrorInfo)
    });
    sleep(1);


    // 라이더 배정
    const req_setDeliveryRider = makeDelivery(DELIVRY_ID, 'ACCEPTED');

    const setDeliveryRider = http.put(URI + "/rider", JSON.stringify(req_setDeliveryRider), params);
    const setDeliveryRiderErrorInfo = 'setDeliveryRider result >>> ';
    check(setDeliveryRider, {
        'setDeliveryRider is OK 200': () => logIfNotOK200AndReturn(setDeliveryRider, setDeliveryRiderErrorInfo)
    });
    sleep(1);


    // 픽업완료
    const req_setPickedUp = makeDelivery(DELIVRY_ID, 'PICKED_UP');
    req_setPickedUp['deliveryStatus'] = 'PICKED_UP';

    const setPickedUp = http.put(URI + "/pickup", JSON.stringify(req_setPickedUp), params);
    const setPickedUpErrorInfo = 'setPickedUp result >>> ';
    check(setPickedUp, {
        'setPickedUp is OK 200': () => logIfNotOK200AndReturn(setPickedUp, setPickedUpErrorInfo)
    });
    sleep(1);


    // 배달완료
    const req_setComplete = makeDelivery(DELIVRY_ID, 'COMPLETE');

    const setComplete = http.put(URI + "/complete", JSON.stringify(req_setComplete), params);
    const setCompleteErrorInfo = 'setComplete error response >>>  ';
    check(setComplete, {
        'setComplete is OK 200': () => logIfNotOK200AndReturn(setComplete, setCompleteErrorInfo)
    });
    sleep(1);
};


function logIfNotOK200AndReturn(response, completeErrorResponse) {
    if (response.status !== 200) {
        console.info(completeErrorResponse + response.body);
    }
    return response.status === 200;
}


function isServerResponding() {
    const req_addDelivery = makeNewDelivery();
    req_addDelivery['riderId'] = null;

    let canRun = false;
    for (let i = 0; i < 3; i++) {
        const addDelivery = http.post(URI, JSON.stringify(req_addDelivery), params);
        if (addDelivery.status === 200) {
            canRun = true;
        }
        sleep(1);
    }
    return canRun;
}


function makeDelivery(id, status) {
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
        'orderTime': new Date().toISOString(),
        'pickupTime': new Date().toISOString(),
        'finishTime': new Date().toISOString()
    };
}
