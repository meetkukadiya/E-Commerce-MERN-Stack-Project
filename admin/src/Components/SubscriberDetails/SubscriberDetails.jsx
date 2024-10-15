import React, { useEffect, useState } from "react";
import "./SubscriberDetails.css";
import cross_icon from "../../assets/cross_icon.png";

const SubscriberDetails = () => {
  const [subscriber, setAllSubscriber] = useState([]);

  const fetchInfo = async () => {
    await fetch("http://localhost:4000/subscriptiondetails")
      .then((res) => res.json())
      .then((data) => {
        setAllSubscriber(data);
      });
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <div className="subscription-listdata">
      <h1>Subscriber Details</h1>
      <table className="subscriber-table">
        <thead>
          <tr>
            <th>Customer Email</th>
            <th>Invoice ID</th>
            <th>Subscription ID</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Payment Status</th>
            <th>Invoice PDF</th>
            <th>Total Paid Amount</th>
          </tr>
        </thead>
        <tbody>
          {subscriber.map((user, index) => (
            <tr key={index}>
              <td>{user.CustomerEmail}</td>
              <td>{user.InvoiceID}</td>
              <td>{user.subscriptionID}</td>
              <td>{user.StartTime}</td>
              <td>{user.EndTime}</td>
              <td>{user.PaymentStatus}</td>
              <td>
                <a href={user.InvoicePDF} download>
                  <button>Download Invoice</button>
                </a>
              </td>
              <td>{user.TotalPaidAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriberDetails;
