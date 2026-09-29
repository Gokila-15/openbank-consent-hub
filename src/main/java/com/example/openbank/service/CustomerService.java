package com.example.openbank.service;

import com.example.openbank.dto.CreateCustomerRequest;
import com.example.openbank.dto.UpdateCustomerRequest;
import com.example.openbank.entity.Customer;
import com.example.openbank.exception.CustomerNotFoundException;
import com.example.openbank.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

  public Customer createCustomer(CreateCustomerRequest request) {

    Customer customer = new Customer();

    customer.setName(request.getName());
    customer.setEmail(request.getEmail());
    customer.setPhone(request.getPhone());

    return customerRepository.save(customer);
}

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

     public Customer getCustomerById(Long id) {

        return customerRepository.findById(id)
                .orElseThrow(() ->
                        new CustomerNotFoundException(
                                "Customer not found with ID: " + id
                        )
                );
    }

   public Customer updateCustomer(
        Long id,
        UpdateCustomerRequest request) {

    Customer customer = customerRepository.findById(id)
            .orElseThrow(() ->
                    new CustomerNotFoundException(
                            "Customer not found with id: " + id));

    customer.setName(request.getName());
    customer.setEmail(request.getEmail());
    customer.setPhone(request.getPhone());

    return customerRepository.save(customer);
}

    public void deleteCustomer(Long id) {

        Customer customer = getCustomerById(id);

        customerRepository.delete(customer);
    }
}