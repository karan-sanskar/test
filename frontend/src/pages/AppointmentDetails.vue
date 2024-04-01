<template>
  <div class="flex flex-col relative m-0">
    <!--header-->
    <div class="flex items-center justify-between p-4" v-if="currentStep != 4">
      <img :src="logoURL" alt="" class="w-[4%]" />
      <!-- <a href="#" class="pt-1 ml-auto text-blue-600 font-semibold" >Sign in</a> -->
    </div>
    <!--end of header-->
    <hr class="mt-1 border-[1.5px]" v-if="currentStep != 4">
    <div class="flex">
      <!--Side bar-->
      <div v-if="currentStep != 4">
        <div class="bg-gray-50 w-[25vw] p-3 h-full" v-if="currentStep != 4">
          <div class="mb-10 flex flex-row">
            <h1 class="font-semibold text-gray-700" :class="{ 'blue-text': one }" :style="{ cursor: 'pointer' }"
              @click="toggleClicked('1')">Select services of good</h1>
            <h1 v-if="currentStep == 1 || currentStep == 2" class="text-blue-600 ml-2" @click="currentStep = 0"
              :style="{ cursor: 'pointer' }">Edit</h1>
          </div>
          <div v-if="currentStep >= 1">
            <div v-for="data in selectedService" :key="data" class="bg-gray-200 p-7 grid grid-cols-1 mb-2">
              <ul>
                <h1>{{ data.service_name }}</h1>
                <h1 class="text-gray-500">{{ data.duration_in_min }} minutes</h1>
              </ul>
            </div>
          </div>
          <div class="mb-10 flex flex-row">
            <h1 class="font-semibold text-gray-600" :class="{ 'blue-text': two }" :style="{ cursor: 'pointer' }"
              @click="toggleClicked('2')">Select Date and time</h1>
            <h1 v-if="currentStep == 2" class="text-blue-600 ml-2" @click="currentStep = 1"
              :style="{ cursor: 'pointer' }">Edit
            </h1>
          </div>
          <div v-if="currentStep >= 2" class="mt-4">
            <div class="bg-gray-200 p-7 grid grid-cols-1 mb-2">
              <ul>
                <h1>{{ datas.day }},{{ datas.selectedDate }} {{ currentMonth }}</h1>
                <h1>{{ datas.selectedTime }}</h1>
              </ul>
            </div>
          </div>
          <div class="mb-10 mt-10">
            <h1 class="font-semibold text-gray-600" :class="{ 'blue-text': three }" :style="{ cursor: 'pointer' }"
              @click="toggleClicked('3')">Enter your details</h1>
            <div v-if="currentStep >= 3" class="mt-4">
              <div class="bg-gray-200 p-7 grid grid-cols-1 mb-2">
                <h1>Name :{{ datas.firstName }} {{ datas.lastName }}</h1>
                <h1>Email :{{ datas.mailId }}</h1>
                <h1>Phone :{{ datas.mobile }}</h1>
                <h1>Gender :{{ datas.gender }}</h1>
                <h1>DOB :{{ datas.dob.getFullYear() }}-{{ datas.dob.getMonth() + 1 }}-{{ datas.dob.getDay() }}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- End of Side Bar -->
      <!--content-->
      <div v-if="currentStep == 0">
        <div class="ml-2 ">
          <fieldset>
            <legend class="font-bold text-[18px] pt-10 mb-8 ml-5">Select one or more services</legend>
            <div class="space-y-5  w-[620px]">
              <div class="ml-2 text-[14px] leading-5 border-gray-300 p-7 border-[2px]" v-for="service in serviceData"
                :key="service.service_name">
                <div class="grid grid-cols-2 gap-1">
                  <label class="font-semibold text-gray-900 mr-32">{{ service.service_name }}</label>
                  <input class="h-4 w-4 text-orange-600 ml-56" type="checkbox" @click="toggleSelectedService(service)"
                    v-model="datas.services[service.service_name]" />
                </div>
                <div class="grid grid-cols-1 gap-2">
                  <p class="text-md text-gray-700 l-editor read-mode" v-html="service.description"></p>
                  <p class="text-md text-gray-700">${{ service.charge }} - {{ service.duration_in_min }} minutes</p>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
      <div v-if="currentStep == 1">
        <div>
          <div class="flex flex-row">
            <div class="w-[800px] h-[65px] p-5 font-bold flex flex-row">
              <h1 @click="prevMonth" :style="{ cursor: 'pointer' }">&lt;</h1>
              <div class="w-3"></div>
              {{ currentMonth }}
              <div class="w-3"></div>
              <h1 @click="nextMonth" :style="{ cursor: 'pointer' }">&gt;</h1>
            </div>
          </div>
          <div>
            <div class="calendar">
              <div class="calendar-body">
                <div v-for="day in daysOfWeek" :key="day" class="calendar-day day">{{ day }}</div>
                <div v-for="date in calendarDates" :key="date" class="calendar-day" :class="{
      'range-date': isInRange(datas.currentYear, datas.currentMonthIndex, date),
      'selected-date': isSelectedDate(date),
      'disable-style': !isInRange(datas.currentYear, datas.currentMonthIndex, date)
    }" @click="handleClick(date)">
                  <span class="date-number">{{ date }}</span>
                  <div v-if="isInRange(datas.currentYear, datas.currentMonthIndex, date)" class="circle"
                    :class="date == '' ? 'border-2 border-white' : ' border-2 border-blue-600'"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-7">
            <h1 class="text-[20px] font-bold" id="availSlots">Available on {{ datas.day }},{{ datas.selectedDate }}
              {{ currentMonth }}</h1>
          </div>
          <div class="mt-7">
            <div v-for="datas in daySlots.message" :key="datas">
              <div class="grid grid-cols-9 gap-2">
                <div v-for="data in datas" :key="data">
                  <button
                    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-md px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                    @click="selectTime(data)">{{ data[0].slice(0, 5) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="currentStep == 2">
        <div>
          <form class="bg-white shadow-sm flex items-center flex-col md:ml-[14rem] p-20">
            <h1 class="text-[36px] font-bold">Collect Patient Data</h1>
            <div class="p-6 pt-10 mt-5">
              <div class="grid gap-y-8">
                <div class="sm:col-span-8">
                  <h3 class="font-semibold text-3xl">Patient Details</h3>
                  <hr class="mt-1" />
                </div>
                <div class="sm:col-span-8">
                  <label class="text-md font-semibold text-gray-900" for="first-name">First name <text
                      class="text-red-500">*</text></label>
                  <div class="mt-2">
                    <input type="text" name="first-name" id="first-name" v-model="datas.firstName"
                      class="w-full rounded-sm text-sm shadow-sm" />
                    <p v-if="!formName && !datas.firstName" class="text-red-500 text-xs italic mt-1">Please enter a
                      First Name</p>
                  </div>
                </div>
                <div class="sm:col-span-8">
                  <label class="text-md font-semibold text-gray-900" for="last-name">Last name </label><text
                    class="text-red-500">*</text>
                  <div class="mt-2">
                    <input type="text" name="last-name" id="last-name" class=" w-full rounded-sm  text-sm shadow-sm"
                      v-model="datas.lastName" />
                    <p v-if="!formLName && !datas.lastName" class="text-red-500 text-xs italic mt-1">Please enter a Last
                      Name</p>
                  </div>
                </div>
                <div class="sm:col-span-4">
                  <label class="text-md font-semibold text-gray-900" for="gender">Gender <text
                      class="text-red-500">*</text></label>
                  <div class="mt-2">
                    <label for="male">Male</label>
                    <input type="radio" id="male" name="gender" class="ml-2 text-orange-600" value="Male"
                      v-model="datas.gender" />
                    <label for="female" class="ml-6">Female</label>
                    <input type="radio" id="female" name="gender" class="ml-2 text-orange-600" value="Female"
                      v-model="datas.gender" />
                    <p v-if="!formPayment && !datas.gender" class="text-red-500 text-xs italic mt-1">Please select a
                      gender</p>
                  </div>
                </div>
                <div class="sm:col-span-4">
                  <label class="text-md font-semibold text-gray-900" for="dob">Date of birth <text
                      class="text-red-500">*</text></label>
                  <div class="mt-2">
                    <VDatePicker v-model="datas.dob">
                      <template #default="{ inputValue, inputEvents }">
                        <input type="text" :value="inputValue" v-on="inputEvents"
                          @input="$emit('input', $event.target.value)" class="w-full rounded-sm  text-sm shadow-sm" />
                      </template>
                    </VDatePicker>
                    <p v-if="!formDOB && !datas.dob" class="text-red-500 text-xs italic mt-1">Please select a date of
                      birth</p>
                  </div>
                </div>
                <div class="sm:col-span-8">
                  <h3 class="font-semibold text-3xl">Contact Information</h3>
                  <hr class="mt-1" />
                </div>
                <div class="sm:col-span-4">
                  <label class="text-md font-semibold text-gray-900" for="email">Email address <text
                      class="text-red-500">*</text></label>
                  <div class="mt-2 mr-3">
                    <input type="email" name="email" id="email" class=" w-[18rem] rounded-sm  text-sm shadow-sm"
                      v-model="datas.mailId" />
                    <p v-if="!formMail && !datas.mailId" class="text-red-500 text-xs italic mt-1">Please enter a valid
                      email</p>
                  </div>
                </div>
                <div class="sm:col-span-4">
                  <label class="text-md font-semibold text-gray-900" for="phone">Mobile number <text
                      class="text-red-500">*</text></label>
                  <div class="mt-2">
                    <input type="tel" v-if="mobileFormat === '#-###-###-####'" name="phone" id="phone"
                      class="rounded-sm text-sm shadow-sm w-full" :value="formattedMobile" @input="formatMobile" />
                    <input type="tel" v-if="mobileFormat === '###-###-####'" name="phone" id="phone"
                      class="rounded-sm text-sm shadow-sm w-full" :value="formattedMobile2" @input="formatMobile2" />
                    <p v-if="!formMobile && !datas.mobile" class="text-red-500 text-xs italic mt-1">Please enter a valid
                      phone number
                    </p>
                  </div>
                </div>
                <div class="sm:col-span-8">
                  <label class="text-md font-semibold text-gray-900" for="address">Address line 1</label>
                  <div class="mt-2">
                    <input type="text" name="address" id="address" class="w-full rounded-sm  text-sm shadow-sm"
                      v-model="datas.address" />
                  </div>
                </div>
                <div class="sm:col-span-4">
                  <label class="text-md font-semibold text-gray-900" for="country">Country</label>
                  <div class="mt-2">
                    <select>

                    </select>
                  </div>
                </div>
                <div class="sm:col-span-8" v-if="paymentData === 0">
                  <h3 class="font-semibold text-3xl">Payment</h3>
                  <hr class="mt-1" />
                </div>
                <div class="sm:col-span-8" v-if="paymentData === 0">
                  <label class="text-md font-semibold text-gray-900" for="payment">Payment method </label><text
                    class="text-red-500">*</text>
                  <div class="mt-2">
                    <select class=" w-full rounded-sm text-sm shadow-sm" v-model="datas.paymentType">
                      <option name="payment" id="payment" disabled selected>Select Option</option>
                      <option name="payment" id="payment" value="Medical or Medi-Cal">Medical or Medi-Cal</option>
                      <option name="payment" id="payment" value="Private Insurance">Private Insurance</option>
                      <option name="payment" id="payment" value="Pay out-of-pocket (at the time of appointment)">Pay
                        out-of-pocket (at
                        the time of appointment)</option>
                      <option name="payment" id="payment" value="Pay out-of-pocket (Pay now via Credit Card)">Pay
                        out-of-pocket (Pay now
                        via Credit Card)</option>
                    </select>
                    <p v-if="!formGender && !datas.paymentType" class="text-red-500 text-xs italic mt-1">Please select a
                      gender</p>
                  </div>
                </div>
                <div class="sm:col-span-8" v-if="datas.paymentType == 'Medical or Medi-Cal'">
                  <label class="text-md font-semibold text-gray-900" for="payment">Medical Beneficiary Identification
                    (MBI) Number or
                    Benefits Identification card (BIC) NUmber</label>
                  <p>Please enter your MBI or BIC number in the policy number field.</p>
                  <div class="mt-2">
                    <label>Policy Number: </label>
                    <input type="text" name="payment" id="payment"
                      class=" w-[18rem] text-md border-l-0 border-r-0 border-t-0" v-model="datas.policyNumber" />
                  </div>
                </div>
                <div class="sm:col-span-8" v-if="datas.paymentType == 'Private Insurance'">
                  <label class="text-md font-semibold text-gray-900" for="payment">Please enter your carrier name and
                    policy number
                    below.</label>
                  <div class="mt-2">
                    <label>Primary Carrier: </label>
                    <input type="text" name="payment" id="payment"
                      class=" w-[18rem] text-md border-l-0 border-r-0 border-t-0"
                      v-model="datas.primaryCarrier" /><text>(eg: UnitedHealth, Wellcare, etc.)</text>
                    <div class="mt-2">
                      <label for="qt">Is the patient the primary policy holder: </label>
                      <label for="Yes">Yes</label>
                      <input type="radio" id="Yes" name="qt" value="Yes" class="ml-1" v-model="datas.qt" />
                      <label class="ml-1" for="No">No</label>
                      <input type="radio" id="No" name="qt" value="No" class="ml-1" v-model="datas.qt" />
                    </div>
                    <div v-if="datas.qt == 'No'">
                      <ul>
                        <li class="mt-2">
                          <label>Primary holder first name (optional): </label>
                          <input type="text" name="first_name" id="first_name"
                            class=" w-[18rem] text-md border-l-0 border-r-0 border-t-0"
                            v-model="datas.holderFirstName" />
                        </li>
                        <li class="mt-2">
                          <label>Primary holder middle name (optional): </label>
                          <input type="text" name="middle_name" id="middle_name"
                            class=" w-[18rem] text-md border-l-0 border-r-0 border-t-0"
                            v-model="datas.holderMiddleName" />
                        </li>
                        <li class="mt-2">
                          <label>Primary holder last name (optional): </label>
                          <input type="text" name="last_name" id="last_name"
                            class=" w-[18rem] text-md border-l-0 border-r-0 border-t-0"
                            v-model="datas.holderLastName" />
                        </li>
                        <li class="mt-2">
                          <label>Primary holder date of birth: </label>
                          <VDatePicker v-model="datas.holderDOB">
                            <template #default="{ inputValue, inputEvents }">
                              <input type="text" :value="inputValue" v-on="inputEvents"
                                @input="$emit('input', $event.target.value)"
                                class="w-[18rem] text-md border-l-0 border-r-0 border-t-0" />
                            </template>
                          </VDatePicker>
                        </li>
                        <li class="mt-2">
                          <label>Relationship to policy holder: </label>
                          <input type="text" name="relation" id="relation"
                            class=" w-[18rem] text-md border-l-0 border-r-0 border-t-0"
                            v-model="datas.holderRelationship" />
                        </li>
                      </ul>
                    </div>
                    <div>
                      <div class="mt-2">
                        <label>Medical Record Number: </label>
                        <input type="text" name="MRN" id="MRN"
                          class=" w-[18rem] text-md border-l-0 border-r-0 border-t-0"
                          v-model="datas.medicalRecordNumber" /><text>(required)</text>
                      </div>
                      <div class="mt-2">
                        <label>Group Number: </label>
                        <input type="text" name="GN" id="GN" class=" w-[18rem] text-md border-l-0 border-r-0 border-t-0"
                          v-model="datas.groupNumber" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div v-if="currentStep == 3">
        <div>
          <form class="bg-white shadow-sm sm:rounded-xl flex justify-center flex-col md:ml-[rem] p-16">
            <h1 class="text-[35px] font-bold">Service specific questionnaraire form</h1>
            <div class="pt-18 mt-5">
              <div class="grid gap-y-16">
                <fieldset>
                  <div v-for="datas of questions.message" :key="datas">
                    <div v-for="(question, listName) in datas" :key="listName">
                      <legend class="text-2xl mb-4 underline text-gray-900 font-semibold mt-3">{{ listName }}</legend>
                      <div v-for="des, index in question" :key="des">
                        <div class="grid grid-cols-[2fr,1fr] items-center">
                          <div class=" flex flex-row">
                            <label class="text-xl text-justify ml-2 w-auto" style="display: inline-block;"
                              v-html="`${index + 1}. `"></label>
                            <label class="text-xl text-justify ml-2 w-auto" style="display: inline-block;"
                              v-html="`${des.description}`"></label>
                          </div>
                          <div class="ml-10 pl-20 p-6 items-center justify-center ">
                            <label :for="'yes-' + listName + '-' + des.question_no" class="mr-2">Yes</label>
                            <input type="radio" :id="'yes-' + listName + '-' + des.question_no" class="mr-3 "
                              :name="'group-' + listName + '-' + des.question_no" value="Yes"
                              @click="insertData(listName, des.question_no, 'YES')">

                            <label :for="'no-' + listName + '-' + des.question_no" class="mr-2">No</label>
                            <input type="radio" :id="'no-' + listName + '-' + des.question_no" class="mr-3"
                              :name="'group-' + listName + '-' + des.question_no" value="No"
                              @click="insertData(listName, des.question_no, 'NO')">

                            <label :for="'na-' + listName + '-' + des.question_no" class="mr-2">NA</label>
                            <input type="radio" :id="'na-' + listName + '-' + des.question_no" class="mr-3"
                              :name="'group-' + listName + '-' + des.question_no" value="NA"
                              @click="insertData(listName, des.question_no, 'NA')">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div v-if="currentStep == 4" class="flex  justify-center items-center h-screen">
        <div class="flex flex-col text-center ml-[750px]">
          <h1 class="text-[35px] font-medium">Thank you</h1>
          <h2 class="font-medium text-[28px] pt-14">Download this to your calendar</h2>
          <div
            class="bg-blue-700 rounded-full w-14 h-14 flex justify-center items-center mt-[10px] ml-[170px] hover:bg-blue-400">
            <FeatherIcon name="download" class="text-white w-8 h-8 cursor-pointer" @click="isOpened = false" />
          </div>
        </div>
      </div>
      <!--end of content-->
    </div>
    <div v-if="currentStep != 4" class="text-center p-[10px]">
      <button v-if="currentStep == 0" class="fixed  bottom-4 right-4 px-4 py-2.5 bg-blue-500 text-white rounded-md"
        @click="initSlot">Continue</button>
      <button v-if="currentStep == 1" class="fixed  bottom-4 right-4 px-4 py-2.5 bg-blue-500 text-white rounded-md"
        @click="nextStep">Continue</button>
      <button v-if="currentStep == 2" class="fixed bottom-4 right-4 px-4 py-2.5 bg-blue-500 text-white rounded-md"
        @click="validateAndBookAppointment">Continue</button>
      <button v-if="currentStep == 3" class="fixed  bottom-4 right-4 px-4 py-2.5 bg-blue-500 text-white rounded-md"
        @click="questionResponse">Continue</button>
    </div>
    <!--popup-->
    <div v-if="isOpened"
      class="w-400 bg-white rounded-6 absolute top-[7%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center text-center px-6 py-1 text-gray-700 border border-gray-300 transform-3d shadow-xl ">
      <FeatherIcon name="x" class="w-8 h-8 absolute top-1 right-1 cursor-pointer" @click="isOpened = false" />
      <img class="w-[50px] mx-auto mt-[10px] rounded-full"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Eo_circle_light-blue_checkmark.svg/1200px-Eo_circle_light-blue_checkmark.svg.png"
        alt="">
      <h2 class="text-2xl font-semibold my-3">Thank You!</h2>
      <p>Your Appointment has been successfully Booked.</p>
    </div>
    <div v-if="isServiceSelected"
      class="w-400 bg-white rounded-6 absolute top-[8%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center text-center px-6 py-1 text-gray-700 border border-gray-300 transform-3d shadow-xl ">
      <FeatherIcon name="x" class="w-6 h-6 absolute top-1 right-1 cursor-pointer" @click="isServiceSelected = false" />
      <img class="w-[50px] mx-auto mt-[10px] rounded-full"
        src="https://image.similarpng.com/very-thumbnail/2021/06/Hazard-warning-attention-sign-with-exclamation-mark-symbol-on-transparent-background-PNG.png"
        alt="">
      <p class="text-black p-5">Please select any service</p>
    </div>
    <div v-if="isDateTimeSelected"
      class="w-400 bg-white rounded-6 absolute top-[8%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center text-center px-6 py-1 text-gray-700 border border-gray-300 transform-3d shadow-xl ">
      <FeatherIcon name="x" class="w-6 h-6 absolute top-1 right-1 cursor-pointer" @click="isDateTimeSelected = false" />
      <img class="w-[50px] mx-auto mt-[10px] rounded-full"
        src="https://image.similarpng.com/very-thumbnail/2021/06/Hazard-warning-attention-sign-with-exclamation-mark-symbol-on-transparent-background-PNG.png"
        alt="">
      <p class="text-black p-5">Select the Date and Time</p>
    </div>
    <!--end of popup-->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { FeatherIcon } from 'frappe-ui'


const formName = ref(true)
const formMail = ref(true)
const formDOB = ref(true)
const formGender = ref(true)
const formMobile = ref(true)
const formPayment = ref(true)
const formLName = ref(true)

const one = ref(false);
const two = ref(false);
const three = ref(false);
const apiData = ref([]);
const serviceData = ref([]);
const paymentData = ref([]);
const logoURL = ref('');
const currentDate = ref(new Date());
const currentStep = ref(0)
const selectedService = ref([])
const selectedStartTime = ref('')
const resList = []
const patientName = ref('')
const patientAppointments = ref([]);
const isOpened = ref(false);
const restrictDays = ref();
const mobileFormat = ref('');
const isServiceSelected = ref(false);
const isDateTimeSelected = ref(false);

let isEditing = ref(false);

const datas = reactive({
  selectedOptionA: ref(''),
  selectedOptionB: ref(''),
  selectedOptionC: ref(''),
  firstName: ref(''),
  lastName: ref(''),
  mobile: ref(''),
  gender: ref(null),
  mailId: ref(''),
  address: ref(''),
  selectView: ref(null),
  selectedTime: ref(''),
  services: {},
  currentMonthIndex: ref(currentDate.value.getMonth()),
  currentYear: ref(currentDate.value.getFullYear()),
  selectedDate: ref(null),
  day: ref(''),
  dob: ref(''),
  paymentType: ref(''),
  policyNumber: ref(''),
  primaryCarrier: ref(''),
  qt: ref(''),
  holderFirstName: ref(''),
  holderMiddleName: ref(''),
  holderLastName: ref(''),
  holderDOB: ref(''),
  holderRelationship: ref(''),
  medicalRecordNumber: ref(''),
  groupNumber: ref(''),
});

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function check(datass) {
  const [dataYear, dataMonth, dataDate] = datass.split('-');
  const [month, year] = currentMonth.value.split(' ');
  let monthIndex = months.indexOf(month);
  monthIndex += 1;
  if (monthIndex == dataMonth && year == dataYear && datas.selectedDate == dataDate) {
    return true;
  }
  return false;
}
const selectTime = (time) => {
  const startTime = time[0].slice(0, 5) + ":00";
  const endTime = time[1].slice(0, 5) + ":00";
  const temp = `${startTime} - ${endTime}`;
  datas.selectedTime = temp;
  selectedStartTime.value = startTime;
};
const toggleSelectedService = (service) => {
  const index = selectedService.value.findIndex(item => item.service_name === service.service_name);
  if (index === -1) {
    selectedService.value.push(service);
  } else {
    selectedService.value.splice(index, 1);
  }
};
const nextStep = () => {
  if (!datas.selectedTime) {
    isDateTimeSelected.value = true
    return;
  }
  isDateTimeSelected.value = false;

  currentStep.value++;
  one.value = false;
  two.value = false;
  three.value = false;
}
function toggleClicked(value) {
  if (value === '1') {
    one.value = true;
    two.value = false;
    three.value = false;
  }
  else if (value === '2') {
    one.value = false;
    two.value = true;
    three.value = false;
  }
  else {
    one.value = false;
    two.value = false;
    three.value = true;
  }
}


let startDate = new Date(2024, 1, 5);
let endDate = new Date(2024, 1, 28);

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const renderCalendar = () => {
  const daysInMonth = new Date(datas.currentYear, datas.currentMonthIndex + 1, 0).getDate();
  const firstDayOfMonth = new Date(datas.currentYear, datas.currentMonthIndex, 1).getDay();
  const calendarDates = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDates.push('');
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDates.push(i);
  }
  return calendarDates;
};
const calendarDates = ref(renderCalendar());
function prevMonth() {
  datas.currentMonthIndex--;
  if (datas.currentMonthIndex < 0) {
    datas.currentMonthIndex = 11;
    datas.currentYear--;
  }
  datas.selectedDate = null;
  updateCurrentMonth();
}

function nextMonth() {
  datas.currentMonthIndex++;
  if (datas.currentMonthIndex > 11) {
    datas.currentMonthIndex = 0;
    datas.currentYear++;
  }
  datas.selectedDate = null;
  updateCurrentMonth();
}

function updateCurrentMonth() {
  currentMonth.value = `${new Date(datas.currentYear, datas.currentMonthIndex).toLocaleString('default', { month: 'long' })} ${datas.currentYear}`;
  calendarDates.value = renderCalendar();
}

const currentMonth = ref(`${new Date(datas.currentYear, datas.currentMonthIndex).toLocaleString('default', { month: 'long' })} ${datas.currentYear}`);

watch(datas.currentMonthIndex, () => {
  currentMonth.value = `${new Date(datas.currentYear, datas.currentMonthIndex.value).toLocaleString('default', { month: 'long' })} ${datas.currentYear}`;
});

watch(datas.currentYear, () => {
  currentMonth.value = `${new Date(datas.currentYear, datas.currentMonthIndex).toLocaleString('default', { month: 'long' })} ${datas.currentYear}`;
});
const isCurrentMonth = (date) => {
  return date !== '' && new Date(datas.currentYear, datas.currentMonthIndex, date).getMonth() === datas.currentMonthIndex;
};
const isSelectedDate = (date) => {
  return datas.selectedDate === date;
};
const getDayOfWeek = (date) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[new Date(date).getDay()];
};
const dayList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function isInRange(year, month, date) {
  const currentDate = new Date(year, month, date);
  const day = currentDate.getDay();
  const dayName = dayList[day];
  return currentDate >= startDate && currentDate <= endDate && restrictDays.value.map((ele) => { return ele }).includes(dayName);
}
function selectDate(date) {
  datas.selectedDate = date;
  isEditing.value = true;
  const selectedDayOfWeek = getDayOfWeek(new Date(datas.currentYear, datas.currentMonthIndex, date));
  datas.day = selectedDayOfWeek;
}


function handleClick(date) {
  if (date == '') {
    let para = document.getElementById('SlotContent');
    para.textContent = "No Slots Available";
  }
  else if (isInRange(datas.currentYear, datas.currentMonthIndex, date)) {
    selectDate(date);
    dateSelected(`${datas.currentYear}-${datas.currentMonthIndex + 1}-${date}`);
  }
  else {
    let para = document.getElementById('SlotContent');
    para.textContent = "No Slots Available";
  }
}


const siteName = ref(window.location.origin);
onMounted(async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Cookie", "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=; full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=");

    const url = new URL(`${siteName.value}/api/method/pharm_ehr_tenant.api.get_event_services`);
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString);
    var event = urlParams.get('event');
    url.searchParams.append("event", event);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        apiData.value = result;
        serviceData.value = result.message.data;
        paymentData.value = result.message.do_no_allow_payment;
        logoURL.value = result.message.logo_url;
      })
  }
  catch (error) {
    console.log('error', error);
  }
});

const apiSlots = ref(null);
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var event = urlParams.get('event');

const initSlot = async () => {
  if (selectedService.value.length == 0) {
    isServiceSelected.value = true;
    return;
  }
  try {
    isServiceSelected.value = false;
    datas.selectedDate = null;
    datas.selectedTime = '';
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Cookie", "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=; full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=");

    const raw = JSON.stringify({
      "event": event
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    fetch(`${siteName.value}/api/method/pharm_ehr_tenant.api.get_all_available_dates`, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        apiSlots.value = result;
        if (apiSlots.value) {
          const [sYear, sMonth, sDate] = apiSlots.value.message.periods.start.split('-');
          const [eYear, eMonth, eDate] = apiSlots.value.message.periods.end.split('-');
          startDate = new Date(sYear, sMonth - 1, sDate);
          endDate = new Date(eYear, eMonth - 1, eDate);
          const restrict = ref(apiSlots.value.message.days);
          restrictDays.value = result.message.days;
          currentStep.value++;
        }
      })
      .catch((error) => console.error(error));
  } catch (error) {
    console.error("Error fetching API:", error);
  }
}

const daySlots = ref([]);
const dateSelected = async (coming) => {

  const services = selectedService._rawValue.map((ele) => { return ele.service_name })


  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Cookie", "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=; full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=");

  const raw = JSON.stringify({
    "event": event,
    "services": services,
    "date": coming
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  try {
    const response = await fetch(`${siteName.value}/api/method/pharm_ehr_tenant.api.get_all_available_slots`, requestOptions);
    const result = await response.json();
    daySlots.value = result;
  } catch (error) {
    console.error(error);
  }
  try {
    const response = await fetch(`${siteName.value}/api/method/pharm_ehr_tenant.api.get_mobile_format`);
    const result = await response.json();
    mobileFormat.value = result.message;
  } catch (error) {
    console.error(error);
  }
}

// const getCountry = async () => {
//   const myHeaders = new Headers();
//   myHeaders.append("Content-Type", "application/json");
//   myHeaders.append("Cookie", "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=; full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=");

//   const requestOptions = {
//     method: "Get",
//     headers: myHeaders,
//     redirect: "follow"
//   };
//   fetch(`${siteName.value}/api/method/frappe.cli.reportview.get`, requestOptions)
//   .then((response) => response.json())
//   .then((result) => console.log(result))


// }



const questions = ref([]);
const getQuestions = async () => {
  const services = selectedService._rawValue.map((ele) => { return ele.service_name })

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Cookie", "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=; full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=");

  const raw = JSON.stringify({
    "event": event,
    "services": services
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  try {
    const response = await fetch(
      `${siteName.value}/api/method/pharm_ehr_tenant.api.get_questionnaires`,
      requestOptions
    );
    const result = await response.json();
    questions.value = result;
    console.log(result);
  } catch (error) {
    console.error(error);
  }
};

const formattedDate = computed(() => {
  const SD = datas.selectedDate;
  const MI = datas.currentMonthIndex;
  const CY = datas.currentYear;
  console.log(SD, "-", MI, "-", CY);

  return `${CY}-${MI + 1}-${SD}`;
});


const validateAndBookAppointment = () => {
  if (!datas.firstName) {
    formName.value = false;
  }
  if (!datas.lastName) {
    formLName.value = false;
  }
  if (!datas.mailId) {
    formMail.value = false;
  }
  if (!datas.mobile) {
    formMobile.value = false;
  }
  if (!datas.gender) {
    formGender.value = false;
  }
  if (!datas.dob) {
    formDOB.value = false;
  }
  if (!datas.paymentType && paymentData.value == 0) {
    formPayment.value = false;
  }
  if (datas.firstName && datas.lastName && datas.mailId && datas.mobile && datas.gender && datas.dob) {
    bookAppointment()
  }
};

const bookAppointment = async () => {

  const services = selectedService._rawValue.map((ele) => { return ele.service_name })

  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Cookie", "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=; full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=");

    const raw = JSON.stringify({
      "event": event,
      "services": services,
      "date": String(formattedDate.value),
      "time": selectedStartTime.value,
      "patient_details": {
        "email": datas.mailId,
        "first_name": datas.firstName,
        "last_name": datas.lastName,
        "mobile": datas.mobile,
        "gender": datas.gender,
        "dob": datas.dob,
        "address": datas.address,
        "payment_type": datas.paymentType,
        "policy_number": datas.policyNumber,
        "primary_carrier": datas.primaryCarrier,
        "patient_primary_policy": datas.qt,
        "policy_holder_firstName": datas.holderFirstName,
        "policy_holder_middleName": datas.holderMiddleName,
        "policy_holder_lastName": datas.holderLastName,
        "policy_holder_dob": datas.holderDOB,
        "policy_holder_relationship": datas.holderRelationship,
        "medical_record_number": datas.medicalRecordNumber,
        "group_number": datas.groupNumber,
      }
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };


    const response = await fetch(`${siteName.value}/api/method/pharm_ehr_tenant.api.book_patient_appointment`, requestOptions);
    if (response.ok) {
      const result = await response.json();
      patientName.value = result.message.patient;
      patientAppointments.value = result.message.patient_appointments;
      isOpened.value = true;
      currentStep.value += 1;
      getQuestions()
    }
  }
  catch (error) {
    console.log(error);
  }
};
const immunName = ref('')
const questionResponse = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Cookie", "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=");

    const raw = JSON.stringify({
      "event": event,
      "patient": patientName.value,
      "questionnaire_response": resList,
      "patient_appointments": patientAppointments.value
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    const response = await fetch(`${siteName.value}/api/method/pharm_ehr_tenant.api.create_questionnaire_response`, requestOptions);
    if (response.ok) {
      const result = await response.json();
      immunName.value = result.message.immunization_id;
      console.log(immunName.value);
      if (datas.paymentType == 'Pay out-of-pocket (Pay now via Credit Card)') {
        paymentEntry();
      }
      else {
        currentStep.value += 1;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const paymentURL = ref('')
const paymentEntry = async () => {

  const services = selectedService._rawValue.map((ele) => { return ele.service_name })

  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Cookie", "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=");

    const raw = JSON.stringify({
      "event": event,
      "services": services,
      "patient": patientName.value,
      "immn_name": immunName.value
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    const response = await fetch(`${siteName.value}/api/method/pharm_ehr_tenant.api.get_payment_url`, requestOptions);
    if (response.ok) {
      const result = await response.json();
      paymentURL.value = result.message.payment_url;
      console.log(paymentURL.value);
      if (paymentURL.value) {
        window.open(paymentURL.value, '_blank');
        currentStep.value += 1;
      }
    }
  } catch (error) {
    console.error(error);
  }
};


watch(datas.mobile, (newValue, oldValue) => {
  if (newValue === "+" || newValue === "") {
    return;
  }
  if (oldValue.length > newValue.length && newValue.length > 1 && oldValue.length % 4 === 1) {
    datas.mobile = newValue.slice(0, -1);
  }
});

const formattedMobile = computed(() => {
  let formatted = datas.mobile.replace(/\D+/g, "");
  let result = "+";
  for (let i = 0; i < formatted.length; i++) {
    if (i === 1) {
      result += "-";
    }
    if ((i === 4 || i === 7) && i !== 0) {
      result += "-";
    }
    result += formatted[i];
    datas.mobile = result;
  }
  return result;
});

function formatMobile(event) {
  let input = event.target.value;
  let formatted = input.replace(/\D+/g, "");
  formatted = "+" + formatted;
  formatted = formatted.replace(/(\d{2})(?=\d)/g, "$1-");
  formatted = formatted.replace(/(\d{3})(?=\d)/g, "$1-");
  datas.mobile = formatted;
}
const formattedMobile2 = computed(() => {
  let formatted = datas.mobile.replace(/\D+/g, "");
  let result = "";
  for (let i = 0; i < formatted.length; i++) {
    if ((i === 3 || i === 6) && i !== 0) {
      result += "-";
    }
    result += formatted[i];
    datas.mobile = result;
  }
  return result;
});

function formatMobile2(event) {
  let input = event.target.value;
  let formatted = input.replace(/\D+/g, "");
  formatted = formatted.replace(/(\d{3})(?=\d)/g, "$1-");
  datas.mobile = formatted;
}

function insertData(name, number, result) {
  const nameExistsIndex = resList.findIndex(item => item.hasOwnProperty(name));

  if (nameExistsIndex === -1) {
    resList.push({ [name]: [{ question_no: number, answer: result }] });
  } else {
    const entryIndex = resList[nameExistsIndex][name].findIndex(entry => entry.question_no === number);

    if (entryIndex === -1) {
      resList[nameExistsIndex][name].push({ question_no: number, answer: result });
    } else {
      resList[nameExistsIndex][name][entryIndex].answer = result;
    }
  }
  console.log(resList);
}


</script>

<style scoped>
.blue-text {
  color: blue;
  text-decoration: underline;
}

body {
  font-family: Arial, sans-serif;
}

.calendar {
  margin: 0 auto;
  border-radius: 5px;
  padding-top: 20px;
}

.calendar-header {
  text-align: center;
  margin-bottom: 10px;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: left;
  border: 1px solid #ccc;
}

.calendar-day {
  height: 100px;
  width: 177px;
  padding: 5px;
  border: 1px solid #cccccc;
  position: relative;

}

.day {
  font-weight: bold;
  padding: 6px;
  height: 40px;
  text-align: center;

}

.date-number {
  position: absolute;
  font-size: 12px;
  top: 20%;
  left: 10%;
  transform: translate(-50%, -50%);
  color: black;
  cursor: pointer;
}

.circle {
  position: absolute;
  top: 20%;
  left: 10%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: transparent;
  z-index: -1;
  transition: background-color 0.3s ease;
}

.range-date::before {
  content: '';
  position: absolute;
  top: 20%;
  left: 10%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: transparent;
  z-index: -1;
}

.range-date.selected-date .circle {
  background-color: blue;
  /* Change background color when date is selected */
}

.range-date.selected-date .date-number {
  color: white;
  /* Change background color when date is selected */
}

.grid-gap-4 {
  display: grid;
  grid-gap: 4px;
  /* Adjust the gap size as needed */
}

.blue-background {
  background-color: #4299e1;
  cursor: pointer;
}

.disable-style {
  cursor: not-allowed;
}

.tranform-3d {
  transform: translateZ(999px);
}
</style>
