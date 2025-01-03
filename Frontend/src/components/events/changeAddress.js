
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiTrash } from 'react-icons/fi'; 
import AddressForm from './AddressForm';
import axios from 'axios';

const ChangeAddress = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [address, setAddress] = useState([]);
  const [isViewAddresses, setIsViewAddresses] = useState(false);
  const [isAddAddressFormVisible, setIsAddAddressFormVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(); 
  const [selectedTime, setSelectedTime] = useState('');

  const handleAddAddress = () => {
    setIsAddAddressFormVisible(!isAddAddressFormVisible);
    setIsEditingAddress(false);
    setAddressToEdit(null);
  };

  const handleViewAddresses = async () => {
    if (!isViewAddresses) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found in localStorage');
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_URL}/api/address/getalladdresses`, {
          headers: { 'token': token },
        });

        if (response.data.address) {
          setAddress(response.data.address);
        } else {
          console.error('Failed to fetch addresses:', response.status);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    }
    setIsViewAddresses(!isViewAddresses);
  };

  const handleEditAddress = (address) => {
    setAddressToEdit(address);
    setIsEditingAddress(true);
    setIsAddAddressFormVisible(true);
  };


  const saveAddress = (newAddress) => {
    if (isEditingAddress) {
      setAddress(
        address.map((addr) =>
          addr.address_id === newAddress.address_id ? newAddress : addr
        )
      );
    } else {
      setAddress([...address, newAddress]);
    }
    setIsAddAddressFormVisible(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    } else {
      navigate('/menu', { state: { address: selectedAddress } });
    }
  };

  const handleSelect = (address_id) => {
    const selectedAddr = address.find(addr => addr.address_id === address_id);
    setSelectedAddressId(address_id);
    setSelectedAddress(selectedAddr);
  };

  return (
    <div
      className="bg-gradient-to-b from-[#008000] to-[#70c656] min-h-screen p-4"
      style={{ fontFamily: process.env.REACT_APP_FONT }} // Use font from .env
    >
      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-black-500 font-bold mb-2">Delivery Location</label>
              <div>
                <button
                  type="button"
                  onClick={handleAddAddress}
                  className="hover:bg-blue-100 text-blue-500 font-bold py-2 px-4 rounded mb-2"
                >
                  + Add Address
                </button>
              </div>
              {isAddAddressFormVisible && (
                <div className="transition-all duration-300 ease-in-out">
                  <AddressForm
                    saveAddress={saveAddress}
                    existingAddress={addressToEdit}
                  />
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={handleViewAddresses}
                  className="hover:bg-blue-100 text-black-500 font-bold py-2 ml-2 px-4 rounded"
                >
                  View Addresses
                </button>
              </div>
              {isViewAddresses && (
                <div>
                  {address.length > 0 ? (
                    address.map((add) => (
                      <div
                        key={add.address_id}
                        className="p-2 border-b border-gray-200 flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="address"
                            //value={add.address_id}
                            checked={selectedAddressId === add.address_id}
                            onChange={() => handleSelect(add.address_id)}
                            className="mr-2"
                          />
                          <p>
                            {add.tag}, {add.pincode}, {add.line1}, {add.line2}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span
                            className="text-blue-500 underline cursor-pointer mr-2"
                            onClick={() => handleEditAddress(add)}
                          >
                            Edit
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No addresses available</p>
                  )}
                </div>
              )}
            </div>

        
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-2 rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              style={{ backgroundColor: process.env.REACT_APP_COLORCODE }} // Use color from .env
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeAddress;





