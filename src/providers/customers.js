// Map between customer address and worker identity
// Used to determine to which worker route a new conversation with a particular customer
//
// {
//     customerAddress: workerIdentity
// }
//
// Example:
//     {
//         'whatsapp:+12345678': 'john@example.com'
//     }
const customersToWorkersMap = {};

// Customers list
// Example:
// [
//   {
//      customer_id: 98,
//      display_name: 'Bobby Shaftoe',
//      channels: [
//          { type: 'email', value: 'bobby@example.com' },
//          { type: 'sms', value: '+123456789' },
//          { type: 'whatsapp', value: 'whatsapp:+123456789' }
//      ],
//      links: [
//          { type: 'Facebook', value: 'https://facebook.com', display_name: 'Social Media Profile' }
//      ],
//      details:{
//          title: "Information",
//          content: "Status: Active" + "\n\n" + "Score: 100"
//      },
//      worker: 'john@example.com'
//   }
// ]

const customers = [
  {
    customer_id: 98,
    display_name: "Henrique Pereira",
    channels: [
      { type: "email", value: "henrique@email.com" },
      { type: "sms", value: "+16056902527" },
    ],
    links: [
      { type: "Facebook", value: "https://facebook.com", display_name: "Henrique Pereira profile" },
    ],
    details: {
      title: "Information",
      content: "Status: Active" + "\n\n" + "Score: 100",
    },
    worker: "henrique.pereira@terazo.com",
  },
  {
    customer_id: 45,
    display_name: "Elijah Thomas",
    channels: [
      { type: "email", value: "elijah@email.com" },
      { type: "sms", value: "+18047189302" },
    ],
    links: [
      { type: "Facebook", value: "https://facebook.com", display_name: "Elijah Thomas profile" },
    ],
    details: {
      title: "Information",
      content: "Status: Active" + "\n\n" + "Score: 100",
    },
    worker: "elijah.thomas@terazo.com",
  },
  {
    customer_id: 97,
    display_name: "Sarah William",
    channels: [
      { type: "email", value: "sarah@example.com" },
      { type: "sms", value: "+123456781" },
    ],
    links: [
      { type: "Facebook", value: "https://facebook.com", display_name: "Social Media Profile" },
    ],
    details: {
      title: "Information",
      content: "Status: Active" + "\n\n" + "Score: 100",
    },
    worker: "henrique.pereira@terazo.com",
  },
  {
    customer_id: 93,
    display_name: "Bill Joe",
    channels: [
      { type: "email", value: "bill@example.com" },
      { type: "sms", value: "+123456785" },
    ],
    links: [
      { type: "Facebook", value: "https://facebook.com", display_name: "Social Media Profile" },
    ],
    details: {
      title: "Information",
      content: "Status: Active" + "\n\n" + "Score: 100",
    },
    worker: "henrique.pereira@terazo.com",
  },
];

const findWorkerForCustomer = async (customerNumber) => customersToWorkersMap[customerNumber];

const findRandomWorker = async () => {
  const onlyUnique = (value, index, self) => {
    return self.indexOf(value) === index;
  };

  const workers = Object.values(customersToWorkersMap).filter(onlyUnique);
  const randomIndex = Math.floor(Math.random() * workers.length);

  return workers[randomIndex];
};

const getCustomersList = async (worker, pageSize, anchor) => {
  const workerCustomers = customers.filter((customer) => customer.worker === worker);
  const list = workerCustomers.map((customer) => ({
    display_name: customer.display_name,
    customer_id: customer.customer_id,
    avatar: customer.avatar,
  }));

  if (!pageSize) {
    return list;
  }

  if (anchor) {
    const lastIndex = list.findIndex((c) => String(c.customer_id) === String(anchor));
    const nextIndex = lastIndex + 1;
    return list.slice(nextIndex, nextIndex + pageSize);
  } else {
    return list.slice(0, pageSize);
  }
};

const getCustomerByNumber = async (customerNumber) => {
  return customers.find((customer) =>
    customer.channels.find((channel) => String(channel.value) === String(customerNumber))
  );
};

const getCustomerById = async (customerId) => {
  return customers.find((customer) => String(customer.customer_id) === String(customerId));
};

module.exports = {
  customersToWorkersMap,
  findWorkerForCustomer,
  findRandomWorker,
  getCustomerById,
  getCustomersList,
  getCustomerByNumber,
};
