package com.example.openbank.controller; 
 
import com.example.openbank.dto.CreateCustomerRequest;
import com.example.openbank.dto.UpdateCustomerRequest;
import com.example.openbank.entity.Customer; 
import com.example.openbank.service.CustomerService; 
import org.springframework.http.HttpStatus; 
import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*; 
import jakarta.validation.Valid;
import java.util.List; 
 
@RestController 
@RequestMapping("/api/customers") 
public class CustomerController { 
 
    private final CustomerService customerService; 
 
    public CustomerController(CustomerService customerService) { 
        this.customerService = customerService; 
    } 
 
    @PostMapping
    public ResponseEntity<Customer> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request) {

        Customer customer = customerService.createCustomer(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(customer);
    }
    @GetMapping 
    public ResponseEntity<List<Customer>> getAllCustomers() { 
 
        return ResponseEntity.ok( 
                customerService.getAllCustomers() 
        ); 
    } 
 
    @GetMapping("/{id}") 
    public ResponseEntity<Customer> getCustomer( 
            @PathVariable Long id) { 
 
        return ResponseEntity.ok( 
                customerService.getCustomerById(id) 
        ); 
    } 
 
   @PutMapping("/{id}")
public ResponseEntity<Customer> updateCustomer(
        @PathVariable Long id,
        @Valid @RequestBody UpdateCustomerRequest request) {

    Customer customer = customerService.updateCustomer(id, request);

    return ResponseEntity.ok(customer);
}
 
    @DeleteMapping("/{id}") 
    public ResponseEntity<Void> deleteCustomer( 
            @PathVariable Long id) { 
 
        customerService.deleteCustomer(id); 
 
        return ResponseEntity.noContent().build(); 
    } 
} 